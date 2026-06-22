"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getErrorMessage } from "@/lib/errors";
import { api } from "../../../convex/_generated/api";

export function OnboardingWizard() {
  const router = useRouter();
  const suggested = useQuery(api.accounts.suggestedUsername, {});
  const completeOnboarding = useMutation(api.accounts.completeOnboarding);

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeholder = suggested ?? "gmail.com-you";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const value = username.trim() || placeholder;
      await completeOnboarding({ username: value });
      router.replace("/app");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save username"));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">Welcome</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Pick your username
        </h1>
        <p className="mt-3 text-muted">
          Public projects live at <span className="font-mono text-foreground">username/project</span>.
          You can change this anytime at <span className="font-mono">/account</span>.
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Use a personal email you will keep — <strong>account email cannot be changed</strong> after
        sign-up.
      </div>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <label className="block">
          <span className="text-sm font-medium text-foreground">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={placeholder}
            className="mt-2 w-full rounded-lg border border-border-strong bg-surface px-4 py-2.5 font-mono text-foreground"
            autoFocus
          />
          <p className="mt-2 text-xs text-muted">
            Default is intentionally ugly — submit as-is (Q18) or type something you like.
          </p>
        </label>

        <button
          type="submit"
          disabled={loading || suggested === undefined}
          className="w-full rounded-xl bg-foreground px-6 py-3 text-sm font-medium text-surface transition-colors hover:bg-muted-foreground disabled:opacity-50"
        >
          {loading ? "Saving…" : "Continue"}
        </button>
      </form>
    </div>
  );
}