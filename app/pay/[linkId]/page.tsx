import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { PayButton } from "@/components/pay/pay-button";
import { SubscribeForm } from "@/components/subscribe-form";
import { BRAND_NAME, DEFAULT_WORDMARK } from "@/lib/brand";
import { getAppSettings } from "@/lib/settings";
import { getServiceSupabase } from "@/lib/supabase/server";
import { formatBsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PayPage({
  params,
}: {
  params: Promise<{ linkId: string }>;
}) {
  const { linkId } = await params;
  const supabase = getServiceSupabase();

  const { data: link, error } = await supabase
    .from("payment_links")
    .select("*")
    .eq("link_token", linkId)
    .maybeSingle();

  if (error || !link) notFound();
  if (link.kind === "event") redirect(`/event/${link.link_token}`);

  let settings = {
    businessName: BRAND_NAME,
    logoPath: null as string | null,
    promoCode: "",
    promoPercent: 0,
  };

  try {
    const app = await getAppSettings();
    settings = {
      businessName: app.businessName,
      logoPath: app.logoPath,
      promoCode: app.promoCode,
      promoPercent: app.promoPercent,
    };
  } catch {
    // fall back to defaults
  }

  const logoSrc = settings.logoPath || DEFAULT_WORDMARK;
  const isPaid = link.status === "paid";

  return (
    <div className="flex min-h-screen flex-col bg-[var(--noob-blue)]">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-8 flex flex-col items-center text-center">
            {settings.logoPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSrc}
                alt={settings.businessName}
                className="mb-4 h-16 w-auto object-contain"
              />
            ) : (
              <Image
                src={DEFAULT_WORDMARK}
                alt={settings.businessName}
                width={320}
                height={80}
                className="mb-4 h-auto w-full max-w-[280px]"
                priority
              />
            )}
            <h1 className="font-body text-2xl font-semibold text-[var(--noob-blue)]">
              {settings.businessName}
            </h1>
          </div>

          <div className="mb-8 space-y-2 text-center">
            <p className="font-body text-sm uppercase tracking-wide text-[var(--noob-muted)]">
              Payment for
            </p>
            <p className="font-body text-xl font-semibold text-[var(--noob-ink)]">
              {link.label}
            </p>
          </div>

          {isPaid ? (
            <div className="space-y-4">
              <p className="font-amount text-center text-4xl font-semibold tracking-tight text-[var(--noob-pink)]">
                {formatBsd(link.amount_cents)}
              </p>
              <div className="rounded-lg bg-green-50 px-4 py-6 text-center">
                <p className="font-body text-xl font-semibold text-green-800">Paid</p>
                <p className="mt-1 text-sm text-green-700">
                  This payment has already been completed. Thank you!
                </p>
              </div>
            </div>
          ) : (
            <PayButton
              linkId={link.link_token}
              amountCents={link.amount_cents}
              promoCode={settings.promoCode}
              promoPercent={settings.promoPercent}
            />
          )}

          <SubscribeForm source="pay" />
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-white/70">
        Powered by KemisPay · Payments processed by Cash N&apos; Go
      </footer>
    </div>
  );
}
