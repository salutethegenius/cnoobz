import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resendConfigured, sendNewsletterBatch } from "@/lib/newsletter/resend";
import { renderNewsletterHtml } from "@/lib/newsletter/template";
import { getServiceSupabase } from "@/lib/supabase/server";

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!resendConfigured()) {
    return NextResponse.json(
      {
        message:
          "Resend is not configured. Set RESEND_API_KEY and RESEND_FROM, then try again.",
      },
      { status: 400 }
    );
  }

  let body: { newsletterId?: string };
  try {
    body = (await request.json()) as { newsletterId?: string };
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const id = String(body.newsletterId ?? "");
  if (!id) {
    return NextResponse.json({ message: "newsletterId is required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data: newsletter, error: nErr } = await supabase
    .from("newsletters")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (nErr || !newsletter) {
    return NextResponse.json({ message: "Newsletter not found" }, { status: 404 });
  }

  const { data: list, error: lErr } = await supabase
    .from("subscribers")
    .select("email, unsubscribe_token")
    .eq("status", "active");
  if (lErr) {
    return NextResponse.json({ message: lErr.message }, { status: 500 });
  }

  const subscribers = list ?? [];
  if (subscribers.length === 0) {
    return NextResponse.json(
      { message: "No active subscribers to send to" },
      { status: 400 }
    );
  }

  const extraImages = Array.isArray(newsletter.extra_images)
    ? (newsletter.extra_images as string[])
    : [];
  const origin = appUrl();

  const messages = subscribers.map((sub) => ({
    to: sub.email as string,
    subject: newsletter.subject as string,
    html: renderNewsletterHtml({
      headline: (newsletter.headline as string) || (newsletter.subject as string),
      body: (newsletter.body as string) || "",
      heroImageUrl: newsletter.hero_image_path as string | null,
      extraImageUrls: extraImages,
      ctaLabel: newsletter.cta_label as string | null,
      ctaUrl: newsletter.cta_url as string | null,
      unsubscribeUrl: `${origin}/unsubscribe/${sub.unsubscribe_token}`,
      appUrl: origin,
    }),
  }));

  try {
    const sent = await sendNewsletterBatch(messages);
    const { error: uErr } = await supabase
      .from("newsletters")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        recipient_count: sent,
      })
      .eq("id", id);
    if (uErr) {
      return NextResponse.json({ message: uErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Send failed" },
      { status: 500 }
    );
  }
}
