import { NextResponse } from "next/server";
import { upsertSubscriber } from "@/lib/newsletter/subscribers";

export async function POST(request: Request) {
  let body: { email?: string; source?: string };
  try {
    body = (await request.json()) as { email?: string; source?: string };
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const source =
    body.source === "event" || body.source === "admin" ? body.source : "pay";

  try {
    const result = await upsertSubscriber({
      email: String(body.email ?? ""),
      source,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Could not subscribe" },
      { status: 400 }
    );
  }
}
