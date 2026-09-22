import assert from "node:assert/strict";
import test from "node:test";
import { bodyToHtml, escapeHtml, renderNewsletterHtml } from "./template";

test("escapeHtml encodes markup", () => {
  assert.equal(escapeHtml('<img src="x">'), "&lt;img src=&quot;x&quot;&gt;");
});

test("bodyToHtml turns paragraphs into <p>", () => {
  const html = bodyToHtml("Hello\n\nWorld");
  assert.match(html, /<p /);
  assert.match(html, /Hello/);
  assert.match(html, /World/);
});

test("locked template includes brand, slots, and unsubscribe", () => {
  const html = renderNewsletterHtml({
    headline: "Drop night",
    body: "Tickets live now.",
    heroImageUrl: "https://example.com/hero.png",
    extraImageUrls: ["https://example.com/extra.png"],
    ctaLabel: "Get tickets",
    ctaUrl: "https://example.com/event",
    unsubscribeUrl: "https://example.com/unsubscribe/abc",
    appUrl: "https://example.com",
  });

  assert.match(html, /Drop night/);
  assert.match(html, /Tickets live now/);
  assert.match(html, /Get tickets/);
  assert.match(html, /#2F4BFF/);
  assert.match(html, /#FF2EC8/);
  assert.match(html, /noob-wordmark.png/);
  assert.match(html, /unsubscribe\/abc/);
  assert.doesNotMatch(html, /<script/);
});
