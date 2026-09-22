import { Resend } from "resend";

export function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(key);
}

export function getResendFrom(): string {
  const from = process.env.RESEND_FROM?.trim();
  if (!from) {
    throw new Error("RESEND_FROM is not set");
  }
  return from;
}

export type OutboundEmail = {
  to: string;
  subject: string;
  html: string;
};

const BATCH_SIZE = 50;

export async function sendNewsletterBatch(messages: OutboundEmail[]) {
  const resend = getResendClient();
  const from = getResendFrom();
  let sent = 0;

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const chunk = messages.slice(i, i + BATCH_SIZE);
    const { error } = await resend.batch.send(
      chunk.map((m) => ({
        from,
        to: [m.to],
        subject: m.subject,
        html: m.html,
      }))
    );
    if (error) {
      throw new Error(error.message || "Resend batch send failed");
    }
    sent += chunk.length;
  }

  return sent;
}
