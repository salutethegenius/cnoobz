import { startOfDayInTimeZone } from "@/lib/time";
import { getServiceSupabase } from "@/lib/supabase/server";

export type RecentTransaction = {
  id: string;
  link_id: string | null;
  customer_ref: string | null;
  amount_cents: number;
  status: string;
  created_at: string;
  order_number: string | null;
  net_cents: number | null;
  payer_email: string | null;
  payer_phone: string | null;
  cng_created_at: string | null;
};

export type DashboardStats = {
  /** Sum of regular payment-link amounts (excludes event tickets). */
  linksIssuedCents: number;
  unpaidLinksCents: number;
  /** Merchant net when available; falls back to gross `amount_cents`. */
  todaysRevenueCents: number;
  todaysFeesCents: number;
};

function revenueCents(row: {
  amount_cents: number | null;
  net_cents?: number | null;
}): number {
  if (row.net_cents != null) return row.net_cents;
  return row.amount_cents ?? 0;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getServiceSupabase();

  const { data: links, error: linksError } = await supabase
    .from("payment_links")
    .select("amount_cents, status, kind")
    .eq("kind", "invoice");

  if (linksError) throw linksError;

  const linksIssuedCents = (links ?? []).reduce(
    (sum, row) => sum + (row.amount_cents ?? 0),
    0
  );
  const unpaidLinksCents = (links ?? [])
    .filter((row) => row.status === "pending")
    .reduce((sum, row) => sum + (row.amount_cents ?? 0), 0);

  const startMs = startOfDayInTimeZone().getTime();

  const { data: txs, error: txsError } = await supabase
    .from("transactions")
    .select("amount_cents, net_cents, fee_cents, created_at, cng_created_at")
    .eq("status", "successful");

  if (txsError) throw txsError;
  const todays = (txs ?? []).filter((row) => {
    const when = row.cng_created_at || row.created_at;
    return when ? new Date(when).getTime() >= startMs : false;
  });

  const todaysRevenueCents = todays.reduce(
    (sum, row) => sum + revenueCents(row),
    0
  );
  const todaysFeesCents = todays.reduce(
    (sum, row) => sum + (row.fee_cents ?? 0),
    0
  );

  return {
    linksIssuedCents,
    unpaidLinksCents,
    todaysRevenueCents,
    todaysFeesCents,
  };
}

export async function getRecentTransactions(
  limit = 8
): Promise<RecentTransaction[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, link_id, customer_ref, amount_cents, status, created_at, order_number, net_cents, payer_email, payer_phone, cng_created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? [])
    .slice()
    .sort((a, b) => {
      const aKey = new Date(a.cng_created_at || a.created_at).getTime();
      const bKey = new Date(b.cng_created_at || b.created_at).getTime();
      return bKey - aKey;
    })
    .slice(0, limit);
}
