import { unsubscribeByToken } from "@/lib/newsletter/subscribers";
import { BRAND_NAME } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let ok = false;
  if (token && token !== "preview") {
    try {
      const row = await unsubscribeByToken(token);
      ok = Boolean(row);
    } catch {
      ok = false;
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--noob-blue)] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="font-body text-2xl font-semibold text-[var(--noob-blue)]">
          {ok ? "You're off the list" : "Unsubscribe"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {ok
            ? `You will not get more ${BRAND_NAME} newsletters.`
            : token === "preview"
              ? "This is a preview unsubscribe link."
              : "This unsubscribe link is invalid or already used."}
        </p>
      </div>
    </div>
  );
}
