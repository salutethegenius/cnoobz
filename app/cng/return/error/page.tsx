import Image from "next/image";
import Link from "next/link";
import { DEFAULT_MARK } from "@/lib/brand";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  unknown_order:
    "We could not find your payment session. Please try again or contact Noobz Network.",
  no_credentials: "Payment provider credentials are not configured.",
  invalid_merchant: "Payment provider credentials are incomplete.",
  generic:
    "Something went wrong while starting your payment. Please try again or contact Noobz Network.",
};

export default async function CngErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  const message = MESSAGES[params.reason ?? "generic"] || MESSAGES.generic;

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
        <h1 className="font-body text-2xl font-semibold text-red-700">Payment error</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
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
