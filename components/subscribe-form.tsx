"use client";

import { FormEvent, useState } from "react";

export function SubscribeForm({ source }: { source: "pay" | "event" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not subscribe");
      setStatus("done");
      setEmail("");
      setMessage("You're on the list.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not subscribe");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 border-t border-slate-200 pt-6">
      <p className="font-body text-sm font-medium text-[var(--noob-blue)]">
        Get Noobz Network drops
      </p>
      <p className="mt-1 text-xs text-slate-500">
        One list. Unsubscribe anytime. Paying is separate.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="flex h-10 min-w-0 flex-1 rounded-md border border-[var(--noob-muted)] bg-white px-3 text-sm"
        />
        <button
          type="submit"
          disabled={status === "saving"}
          className="h-10 shrink-0 rounded-md bg-[var(--noob-blue)] px-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Join"}
        </button>
      </div>
      {message && (
        <p
          className={`mt-2 text-xs ${status === "error" ? "text-red-600" : "text-green-700"}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
