"use client";

import NextError from "next/error";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  void error;

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[var(--noob-bg)] px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="font-heading text-2xl text-red-700">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Please refresh the page. If it keeps happening, contact Noobz
            Network.
          </p>
        </div>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
