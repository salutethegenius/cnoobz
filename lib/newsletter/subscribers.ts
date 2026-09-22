import { nanoid } from "nanoid";
import { getServiceSupabase } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email) || email.length > 254) return null;
  return email;
}

export async function upsertSubscriber(opts: {
  email: string;
  source: "pay" | "event" | "admin";
}) {
  const email = normalizeEmail(opts.email);
  if (!email) {
    throw new Error("Enter a valid email address");
  }

  const supabase = getServiceSupabase();
  const { data: existing, error: lookupError } = await supabase
    .from("subscribers")
    .select("id, status, unsubscribe_token")
    .eq("email", email)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (existing) {
    if (existing.status === "unsubscribed") {
      const { error } = await supabase
        .from("subscribers")
        .update({
          status: "active",
          source: opts.source,
          unsubscribed_at: null,
        })
        .eq("id", existing.id);
      if (error) throw error;
    }
    return { email, created: false };
  }

  const { error } = await supabase.from("subscribers").insert({
    email,
    source: opts.source,
    status: "active",
    unsubscribe_token: nanoid(24),
  });
  if (error) throw error;
  return { email, created: true };
}

export async function unsubscribeByToken(token: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("subscribers")
    .update({
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("unsubscribe_token", token)
    .select("email")
    .maybeSingle();
  if (error) throw error;
  return data;
}
