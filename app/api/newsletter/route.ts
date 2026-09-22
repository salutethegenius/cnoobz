import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getServiceSupabase } from "@/lib/supabase/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("newsletters")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({ newsletters: data ?? [] });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: {
    subject?: string;
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

  const subject = String(body.subject ?? "").trim();
  if (!subject) {
    return NextResponse.json({ message: "Subject is required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("newsletters")
    .insert({
      subject,
      headline: String(body.headline ?? "").trim() || null,
      body: String(body.body ?? "").trim() || null,
      hero_image_path: body.heroImagePath || null,
      extra_images: Array.isArray(body.extraImages) ? body.extraImages : [],
      cta_label: body.ctaLabel?.trim() || null,
      cta_url: body.ctaUrl?.trim() || null,
      status: "draft",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({ newsletter: data });
}
