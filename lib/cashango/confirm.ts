import { fetchCngTransaction, getCngApiAuth } from "./api";
import { mapCngTransactionToRow, toCents } from "./map";
import { settlePaidCheckout } from "./settle";
import type { CngTransaction } from "./types";
import { upsertTransactionRow } from "./upsert";
import { getServiceSupabase } from "@/lib/supabase/server";

export type ConfirmSession = {
  id: string;
  link_id: string;
  status: string;
  order_number: string;
  expected_amount_cents: number;
};

export type ConfirmView = "invalid" | "confirming" | "settled";

export type ConfirmDecision =
  | { action: "invalid"; reason: "missing_order" | "unknown_order" }
  | {
      action: "confirming";
      reason:
        | "missing_cng"
        | "not_processed"
        | "amount_mismatch"
        | "order_mismatch";
    }
  | { action: "settle" };

function isProcessed(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}

/**
 * Decide whether a return URL may settle a checkout.
 * Query STATUS=PAID is ignored — only the CNG transaction-info payload counts.
 */
export function evaluateCngReturn(input: {
  orderNumber?: string | null;
  session: ConfirmSession | null;
  cngTx: CngTransaction | null;
}): ConfirmDecision {
  const orderNumber = input.orderNumber?.trim();
  if (!orderNumber) {
    return { action: "invalid", reason: "missing_order" };
  }
  if (!input.session) {
    return { action: "invalid", reason: "unknown_order" };
  }
  if (!input.cngTx) {
    return { action: "confirming", reason: "missing_cng" };
  }
  if (!isProcessed(input.cngTx.processed)) {
    return { action: "confirming", reason: "not_processed" };
  }
  if (String(input.cngTx.webOrderNumber ?? "") !== input.session.order_number) {
    return { action: "confirming", reason: "order_mismatch" };
  }
  if (toCents(input.cngTx.amount) !== input.session.expected_amount_cents) {
    return { action: "confirming", reason: "amount_mismatch" };
  }
  return { action: "settle" };
}

export async function confirmPaidReturn(params: {
  orderNumber?: string | null;
  paymentId?: string | null;
}): Promise<ConfirmView> {
  const orderNumber = params.orderNumber?.trim() || null;
  const paymentId = params.paymentId?.trim() || null;

  if (!orderNumber) {
    return "invalid";
  }

  const supabase = getServiceSupabase();
  const { data: session, error } = await supabase
    .from("checkout_sessions")
    .select("id, link_id, status, order_number, expected_amount_cents")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !session) {
    return "invalid";
  }

  if (session.status === "completed") {
    return "settled";
  }

  let cngTx: CngTransaction | null = null;
  try {
    const auth = await getCngApiAuth();
    cngTx = paymentId
      ? await fetchCngTransaction(auth, { paymentId })
      : await fetchCngTransaction(auth, { orderNumber: orderNumber! });
  } catch {
    return "confirming";
  }

  const decision = evaluateCngReturn({
    orderNumber,
    session,
    cngTx,
  });

  if (decision.action !== "settle" || !cngTx) {
    return "confirming";
  }

  await settlePaidCheckout(supabase, session);
  await upsertTransactionRow(
    supabase,
    mapCngTransactionToRow(cngTx, { linkId: session.link_id })
  );
  return "settled";
}
