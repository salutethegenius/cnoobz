import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ASSETS_BUCKET } from "@/lib/brand";
import { getServiceSupabase } from "@/lib/supabase/server";

const MAX_SIZE = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ message: "Image is required" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ message: "Image must be under 4 MB" }, { status: 400 });
  }
  if (file.type && !ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { message: "Use jpg, png, webp, or gif" },
      { status: 400 }
    );
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const supabase = getServiceSupabase();
  const path = `newsletter/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(ASSETS_BUCKET).upload(path, buffer, {
    contentType: file.type || `image/${ext}`,
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(ASSETS_BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}
