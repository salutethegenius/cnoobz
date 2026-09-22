import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { LinkGenerator } from "@/components/dashboard/link-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDashboardStats,
  getRecentTransactions,
  type RecentTransaction,
} from "@/lib/analytics";
import { formatBusinessDateTime } from "@/lib/time";
import { formatBsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let loadError: string | null = null;
  let stats = {
    linksIssuedCents: 0,
    unpaidLinksCents: 0,
    todaysRevenueCents: 0,
    todaysFeesCents: 0,
  };
  let recent: RecentTransaction[] = [];

  try {
    [stats, recent] = await Promise.all([
      getDashboardStats(),
      getRecentTransactions(8),
    ]);
  } catch {
    loadError = "Could not load dashboard stats. Check the database connection.";
  }

  const cards = [
    {
      label: "Links issued",
      value: formatBsd(stats.linksIssuedCents),
      accent: "text-[var(--noob-blue)]",
    },
    {
      label: "Unpaid links",
      value: formatBsd(stats.unpaidLinksCents),
      accent: "text-[var(--noob-pink)]",
    },
    {
      label: "Today's Revenue (net)",
      value: formatBsd(stats.todaysRevenueCents),
      accent: "text-[var(--noob-blue)]",
    },
    {
      label: "Today's Fees",
      value: formatBsd(stats.todaysFeesCents),
      accent: "text-[var(--noob-pink)]",
    },
  ];

  return (
    <DashboardShell title="Dashboard">
      {loadError && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}
        </p>
      )}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="overflow-hidden">
            <div className="h-1 bg-[var(--noob-pink)]" />
            <CardHeader>
              <CardTitle>{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`font-amount text-3xl font-semibold tracking-tight ${card.accent}`}
              >
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <LinkGenerator />

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-4">
          <h2 className="font-heading text-xl font-semibold text-[var(--noob-blue)]">
            Recent transactions
          </h2>
          <Link
            href="/dashboard/transactions"
            className="text-sm font-medium text-[var(--noob-blue)] underline"
          >
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--noob-muted)] bg-white p-8 text-center text-sm text-[var(--noob-blue)]/60">
            No transactions yet. Complete a payment or sync from Cash N&apos; Go.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--noob-muted)]/50 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[var(--noob-muted)]/40 bg-[var(--noob-bg)] text-[var(--noob-blue)]/70">
                <tr>
                  <th className="px-4 py-3 font-medium">Payer</th>
                  <th className="px-4 py-3 font-medium">Order #</th>
                  <th className="px-4 py-3 font-medium">Gross</th>
                  <th className="px-4 py-3 font-medium">Net</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((tx) => {
                  const payer =
                    tx.payer_email || tx.payer_phone || tx.customer_ref || "—";
                  const when = tx.cng_created_at || tx.created_at;
                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-[var(--noob-muted)]/25 last:border-0"
                    >
                      <td className="px-4 py-3 text-[var(--noob-blue)]">
                        {payer}
                        {!tx.link_id && (
                          <div className="text-xs text-[var(--noob-blue)]/55">
                            External / pre-CNOOBZ
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--noob-blue)]">
                        {tx.order_number || "—"}
                      </td>
                      <td className="font-amount px-4 py-3 text-[var(--noob-blue)]">
                        {formatBsd(tx.amount_cents)}
                      </td>
                      <td className="font-amount px-4 py-3 text-[var(--noob-blue)]">
                        {tx.net_cents != null ? formatBsd(tx.net_cents) : "—"}
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
      </section>
    </DashboardShell>
  );
}

function statusClass(status: string) {
  if (status === "successful")
    return "bg-[var(--noob-muted)]/40 text-[var(--noob-blue)]";
  if (status === "failed") return "bg-red-100 text-red-800";
  return "bg-[var(--noob-pink)]/15 text-[var(--noob-pink)]";
}
