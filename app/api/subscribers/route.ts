import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { normalizeEmail, upsertSubscriber } from "@/lib/newsletter/subscribers";
import { getServiceSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("subscribers")
    .select("email, status, source, created_at, unsubscribed_at")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  if (format === "csv") {
    const header = "email,status,source,created_at,unsubscribed_at";
    const lines = rows.map((r) =>
      [r.email, r.status, r.source, r.created_at, r.unsubscribed_at ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    return new NextResponse([header, ...lines].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=subscribers.csv",
      },
    });
  }

  const active = rows.filter((r) => r.status === "active").length;
  return NextResponse.json({ subscribers: rows, activeCount: active, total: rows.length });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: { emails?: string[] };
  try {
    body = (await request.json()) as { emails?: string[] };
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const incoming = Array.isArray(body.emails) ? body.emails : [];
  const unique = [
    ...new Set(
      incoming
        .map((e) => normalizeEmail(String(e)))
        .filter((e): e is string => Boolean(e))
    ),
  ];

  let imported = 0;
  for (const email of unique) {
    await upsertSubscriber({ email, source: "admin" });
    imported += 1;
  }

  return NextResponse.json({ ok: true, imported });
}
