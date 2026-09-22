import { SyncTransactionsButton } from "@/components/dashboard/sync-transactions-button";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SETTINGS_KEYS } from "@/lib/db/schema";
import { getSettingMap } from "@/lib/settings";
import { getServiceSupabase } from "@/lib/supabase/server";
import { formatBusinessDateTime } from "@/lib/time";
import { formatBsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

type TransactionRow = {
  id: string;
  link_id: string | null;
  customer_ref: string | null;
  amount_cents: number;
  status: string;
  created_at: string;
  order_number: string | null;
  cng_payment_id: string | null;
  fee_cents: number | null;
  net_cents: number | null;
  payer_email: string | null;
  payer_phone: string | null;
  payment_method: string | null;
  cng_created_at: string | null;
};

function statusClass(status: string) {
  if (status === "successful")
    return "bg-[var(--noob-muted)]/40 text-[var(--noob-blue)]";
  if (status === "failed") return "bg-red-100 text-red-800";
  return "bg-[var(--noob-pink)]/15 text-[var(--noob-pink)]";
}

function sortKey(row: TransactionRow) {
  return new Date(row.cng_created_at || row.created_at).getTime();
}

export default async function TransactionsPage() {
  let rows: TransactionRow[] = [];
  let lastSyncedAt: string | null = null;
  let loadError: string | null = null;

  try {
    const supabase = getServiceSupabase();
    const [{ data, error }, settings] = await Promise.all([
      supabase
        .from("transactions")
        .select(
          "id, link_id, customer_ref, amount_cents, status, created_at, order_number, cng_payment_id, fee_cents, net_cents, payer_email, payer_phone, payment_method, cng_created_at"
        )
        .order("created_at", { ascending: false }),
      getSettingMap(),
    ]);

    if (error) throw error;
    rows = (data ?? []).slice().sort((a, b) => sortKey(b) - sortKey(a));
    lastSyncedAt = settings[SETTINGS_KEYS.cngLastSyncAt] || null;
  } catch {
    rows = [];
    loadError = "Could not load transactions. Check the database connection.";
  }

  return (
    <DashboardShell title="Transactions">
      {loadError && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}
        </p>
      )}
      <SyncTransactionsButton lastSyncedAt={lastSyncedAt} />

      {loadError ? null : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--noob-muted)] bg-white p-10 text-center text-sm text-[var(--noob-blue)]/60">
          No transactions yet. Sync from Cash N&apos; Go or wait for a completed
          payment.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--noob-muted)]/50 bg-white">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-[var(--noob-muted)]/40 bg-[var(--noob-bg)] text-[var(--noob-blue)]/70">
              <tr>
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">CNG Payment ID</th>
                <th className="px-4 py-3 font-medium">Gross</th>
                <th className="px-4 py-3 font-medium">Fee</th>
                <th className="px-4 py-3 font-medium">Net</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Payer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tx) => {
                const payer =
                  tx.payer_email || tx.payer_phone || tx.customer_ref || "—";
                const when = tx.cng_created_at || tx.created_at;
                return (
                  <tr
                    key={tx.id}
                    className="border-b border-[var(--noob-muted)]/25 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-[var(--noob-blue)]">
                      {tx.order_number || "—"}
                      {!tx.link_id && (
                        <div className="text-xs font-normal text-[var(--noob-blue)]/55">
                          External / pre-CNOOBZ
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--noob-blue)]">
                      {tx.cng_payment_id || "—"}
                    </td>
                    <td className="font-amount px-4 py-3 text-[var(--noob-blue)]">
                      {formatBsd(tx.amount_cents)}
                    </td>
                    <td className="font-amount px-4 py-3 text-[var(--noob-blue)]">
                      {tx.fee_cents != null ? formatBsd(tx.fee_cents) : "—"}
                    </td>
                    <td className="font-amount px-4 py-3 text-[var(--noob-blue)]">
                      {tx.net_cents != null ? formatBsd(tx.net_cents) : "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--noob-blue)]">
                      {tx.payment_method || "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--noob-blue)]">
                      {payer}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusClass(tx.status)}`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--noob-blue)]/70">
                      {formatBusinessDateTime(when)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
