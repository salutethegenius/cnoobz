import { BRAND_NAME } from "@/lib/brand";

export type NewsletterSlots = {
  headline: string;
  body: string;
  heroImageUrl?: string | null;
  extraImageUrls?: string[];
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  unsubscribeUrl: string;
  appUrl: string;
};

const BLUE = "#2F4BFF";
const PINK = "#FF2EC8";
const WHITE = "#FFFFFF";
const INK = "#0B0D14";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function bodyToHtml(body: string): string {
  return escapeHtml(body)
    .split(/\n{2,}/)
    .map((para) => `<p style="margin:0 0 16px 0;line-height:1.6;">${para.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export function renderNewsletterHtml(slots: NewsletterSlots): string {
  const wordmark = `${slots.appUrl.replace(/\/$/, "")}/noob-wordmark.png`;
  const extra = (slots.extraImageUrls ?? []).filter(Boolean);
  const headline = escapeHtml(slots.headline.trim() || BRAND_NAME);
  const bodyHtml = bodyToHtml(slots.body.trim() || "");
  const ctaLabel = slots.ctaLabel?.trim();
  const ctaUrl = slots.ctaUrl?.trim();

  const hero = slots.heroImageUrl
    ? `<tr><td style="padding:0 24px 24px 24px;">
        <img src="${escapeHtml(slots.heroImageUrl)}" alt="" width="552" style="display:block;width:100%;max-width:552px;height:auto;border:0;border-radius:8px;"/>
      </td></tr>`
    : "";

  const extras = extra
    .map(
      (url) => `<tr><td style="padding:0 24px 16px 24px;">
        <img src="${escapeHtml(url)}" alt="" width="552" style="display:block;width:100%;max-width:552px;height:auto;border:0;border-radius:8px;"/>
      </td></tr>`
    )
    .join("");

  const cta =
    ctaLabel && ctaUrl
      ? `<tr><td style="padding:8px 24px 32px 24px;" align="center">
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:${PINK};color:${WHITE};text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;padding:14px 28px;border-radius:6px;">${escapeHtml(ctaLabel)}</a>
        </td></tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;background:${BLUE};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BLUE};">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:${WHITE};border-radius:16px;overflow:hidden;">
          <tr>
            <td align="center" style="background:${BLUE};padding:28px 24px;">
              <img src="${escapeHtml(wordmark)}" alt="${escapeHtml(BRAND_NAME)}" width="320" style="display:block;width:100%;max-width:320px;height:auto;border:0;"/>
            </td>
          </tr>
          ${hero}
          <tr>
            <td style="padding:24px 24px 8px 24px;font-family:Arial,Helvetica,sans-serif;color:${INK};font-size:28px;font-weight:bold;line-height:1.2;">
              ${headline}
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 8px 24px;font-family:Arial,Helvetica,sans-serif;color:${INK};font-size:16px;">
              ${bodyHtml}
            </td>
          </tr>
          ${extras}
          ${cta}
          <tr>
            <td style="background:#0B0D14;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#9aa8ff;font-size:12px;line-height:1.5;" align="center">
              ${escapeHtml(BRAND_NAME)} · you&apos;re on the only list<br/>
              <a href="${escapeHtml(slots.unsubscribeUrl)}" style="color:${PINK};">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
