import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--noob-bg)] px-4">
      <h1 className="font-heading text-3xl text-[var(--noob-blue)]">
        Not found
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        This page or payment link does not exist.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm text-[var(--noob-pink)] underline"
      >
        Go home
      </Link>
    </div>
  );
}
