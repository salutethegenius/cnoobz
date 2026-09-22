"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Subscriber = {
  email: string;
  status: string;
  source: string;
  created_at: string;
};

type NewsletterRow = {
  id: string;
  subject: string;
  status: string;
  sent_at: string | null;
  recipient_count: number;
  created_at: string;
};

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.set("image", file);
  const res = await fetch("/api/newsletter/upload", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Upload failed");
  return data.url as string;
}

export function NewsletterComposer({
  resendReady,
}: {
  resendReady: boolean;
}) {
  const [subject, setSubject] = useState("");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [hero, setHero] = useState<string | null>(null);
  const [extras, setExtras] = useState<string[]>([]);
  const [preview, setPreview] = useState<string>("");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [history, setHistory] = useState<NewsletterRow[]>([]);
  const [importText, setImportText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const slots = useMemo(
    () => ({
      subject,
      headline,
      body,
      heroImagePath: hero,
      extraImages: extras,
      ctaLabel,
      ctaUrl,
    }),
    [subject, headline, body, hero, extras, ctaLabel, ctaUrl]
  );

  async function refresh() {
    const [subRes, newsRes] = await Promise.all([
      fetch("/api/subscribers"),
      fetch("/api/newsletter"),
    ]);
    if (subRes.ok) {
      const data = await subRes.json();
      setSubscribers(data.subscribers ?? []);
      setActiveCount(data.activeCount ?? 0);
    }
    if (newsRes.ok) {
      const data = await newsRes.json();
      setHistory(data.newsletters ?? []);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch("/api/newsletter/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slots),
      });
      if (res.ok) {
        const data = await res.json();
        setPreview(data.html ?? "");
      }
    }, 250);
    return () => clearTimeout(t);
  }, [slots]);

  async function onSaveAndSend(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setToast(null);
    try {
      const save = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slots),
      });
      const saved = await save.json();
      if (!save.ok) throw new Error(saved.message || "Could not save");

      const send = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsletterId: saved.newsletter.id }),
      });
      const sent = await send.json();
      if (!send.ok) throw new Error(sent.message || "Could not send");

      setToast(`Sent to ${sent.sent} subscriber${sent.sent === 1 ? "" : "s"}`);
      setSubject("");
      setHeadline("");
      setBody("");
      setCtaLabel("");
      setCtaUrl("");
      setHero(null);
      setExtras([]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  async function onImport(e: FormEvent) {
    e.preventDefault();
    const emails = importText
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Import failed");
      setImportText("");
      setToast(`Imported ${data.imported}`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-slate-500">Active</p>
            <p className="font-heading text-3xl text-[var(--noob-blue)]">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
            <p className="font-heading text-3xl text-[var(--noob-blue)]">
              {subscribers.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-end justify-between gap-3 pt-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">List</p>
              <p className="text-sm text-slate-600">One list. CSV export.</p>
            </div>
            <a href="/api/subscribers?format=csv">
              <Button type="button" variant="outline" size="sm">
                Export CSV
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>

      {!resendReady && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Add RESEND_API_KEY and RESEND_FROM to send. You can still compose and
          preview.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={onSaveAndSend} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-xl text-[var(--noob-blue)]">
                Compose
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Brand colors, header, and footer stay locked. Fill the slots.
              </p>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Body</Label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className="w-full rounded-md border border-[var(--noob-muted)] px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero">Hero image</Label>
                <Input
                  id="hero"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setHero(await uploadImage(file));
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Upload failed");
                    }
                  }}
                />
                {hero && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={hero} alt="" className="mt-2 max-h-32 rounded-md object-cover" />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="extra">Extra images</Label>
                <Input
                  id="extra"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await uploadImage(file);
                      setExtras((prev) => [...prev, url]);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Upload failed");
                    }
                  }}
                />
                {extras.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {extras.map((url) => (
                      <button
                        type="button"
                        key={url}
                        className="relative"
                        onClick={() =>
                          setExtras((prev) => prev.filter((u) => u !== url))
                        }
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-16 w-16 rounded object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ctaLabel">CTA label</Label>
                  <Input
                    id="ctaLabel"
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    placeholder="Get tickets"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaUrl">CTA URL</Label>
                  <Input
                    id="ctaUrl"
                    type="url"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="https://"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {toast && (
                <p className="rounded-md bg-[var(--noob-muted)]/30 px-3 py-2 text-sm text-[var(--noob-blue)]">
                  {toast}
                </p>
              )}
              <Button type="submit" disabled={busy || !resendReady}>
                {busy ? "Working…" : `Send to ${activeCount} subscriber${activeCount === 1 ? "" : "s"}`}
              </Button>
            </CardContent>
          </Card>
        </form>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl text-[var(--noob-blue)]">
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <iframe
              title="Newsletter preview"
              className="h-[720px] w-full rounded-md border border-slate-200 bg-[var(--noob-blue)]"
              srcDoc={preview}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl text-[var(--noob-blue)]">
              Import emails
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onImport} className="space-y-3">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={6}
                placeholder="one@email.com, two@email.com"
                className="w-full rounded-md border border-[var(--noob-muted)] px-3 py-2 text-sm"
              />
              <Button type="submit" variant="outline" disabled={busy}>
                Import
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl text-[var(--noob-blue)]">
              Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-500">
                    <th className="py-2">Email</th>
                    <th>Status</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.slice(0, 50).map((s) => (
                    <tr key={s.email} className="border-t border-slate-100">
                      <td className="py-2">{s.email}</td>
                      <td>{s.status}</td>
                      <td>{s.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {subscribers.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-500">
                  No subscribers yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl text-[var(--noob-blue)]">
            Sent
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">No newsletters yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="py-2">Subject</th>
                  <th>Status</th>
                  <th>Recipients</th>
                </tr>
              </thead>
              <tbody>
                {history.map((n) => (
                  <tr key={n.id} className="border-t border-slate-100">
                    <td className="py-2">{n.subject}</td>
                    <td>{n.status}</td>
                    <td>{n.recipient_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
