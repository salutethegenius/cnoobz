import Image from "next/image";
import Link from "next/link";
import { DEFAULT_MARK } from "@/lib/brand";
import { confirmPaidReturn } from "@/lib/cashango/confirm";

export const dynamic = "force-dynamic";

export default async function CngSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    ORDER_NUMBER?: string;
    PAYMENT_ID?: string;
    STATUS?: string;
  }>;
}) {
  const params = await searchParams;
  let view: "invalid" | "confirming" | "settled" = "invalid";

  try {
    view = await confirmPaidReturn({
      orderNumber: params.ORDER_NUMBER,
      paymentId: params.PAYMENT_ID,
    });
  } catch {
    view = "confirming";
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--noob-blue)] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <Image
          src={DEFAULT_MARK}
          alt="Noobz Network"
          width={88}
          height={88}
          className="mx-auto mb-4 object-contain"
        />
        {view === "invalid" ? (
          <>
            <h1 className="font-body text-2xl font-semibold text-red-700">
              Invalid payment response
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              We could not verify this return. If you were charged, contact
              Noobz Network.
            </p>
          </>
        ) : view === "settled" ? (
          <>
            <h1 className="font-body text-2xl font-semibold text-[var(--noob-blue)]">
              Payment successful
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Thank you! Your payment has been confirmed.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-body text-2xl font-semibold text-[var(--noob-pink)]">
              Payment received
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              We&apos;re confirming your payment. This usually takes a moment.
              You can close this window.
            </p>
          </>
        )}
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-[var(--noob-blue)] underline"
        >
          Done
        </Link>
      </div>
      <p className="mt-6 text-xs text-white/70">
        Powered by KemisPay · Payments processed by Cash N&apos; Go
      </p>
    </div>
  );
}
