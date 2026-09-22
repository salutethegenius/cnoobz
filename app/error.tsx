"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--noob-bg)] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="font-heading text-2xl text-red-700">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Please try again. If it keeps happening, contact Noobz Network.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-[var(--noob-pink)] px-4 py-2 text-sm font-medium text-white transition hover:brightness-105"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
