import Image from "next/image";
import Link from "next/link";
import { DEFAULT_MARK } from "@/lib/brand";

export default function CngCancelPage() {
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
        <h1 className="font-body text-2xl font-semibold text-[var(--noob-blue)]">
          Payment cancelled
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No charge was made. You can close this window or return to your
          payment link to try again.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-[var(--noob-blue)] underline"
        >
          Close
        </Link>
      </div>
      <p className="mt-6 text-xs text-white/70">
        Powered by KemisPay · Payments processed by Cash N&apos; Go
      </p>
    </div>
  );
}
