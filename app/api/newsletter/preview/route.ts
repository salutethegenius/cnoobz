import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { renderNewsletterHtml } from "@/lib/newsletter/template";

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

  let body: {
    headline?: string;
    body?: string;
    heroImagePath?: string | null;
    extraImages?: string[];
    ctaLabel?: string | null;
    ctaUrl?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const html = renderNewsletterHtml({
    headline: String(body.headline ?? ""),
    body: String(body.body ?? ""),
    heroImageUrl: body.heroImagePath || null,
    extraImageUrls: Array.isArray(body.extraImages) ? body.extraImages : [],
    ctaLabel: body.ctaLabel || null,
    ctaUrl: body.ctaUrl || null,
    unsubscribeUrl: `${appUrl()}/unsubscribe/preview`,
    appUrl: appUrl(),
  });

  return NextResponse.json({ html });
}
