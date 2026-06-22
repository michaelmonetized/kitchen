"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { getErrorMessage } from "@/lib/errors";
import { api } from "../../../../../convex/_generated/api";

export default function AccountPage() {
  const account = useQuery(api.accounts.getCurrentAccount, {});
  const changeUsername = useMutation(api.accounts.changeUsername);

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (account === undefined) {
    return <p className="p-8 text-muted">Loading…</p>;
  }

  if (!account) {
    return <p className="p-8 text-muted">No account found.</p>;
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await changeUsername({ username });
      setMessage(`Username updated to ${result.username}. Old URLs 301 to the new slug.`);
      setUsername("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to change username"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Account</h1>
      <p className="mt-2 text-sm text-muted">
        Email is permanent. Username powers your public URLs.
      </p>

      <dl className="mt-8 space-y-4 rounded-xl border border-border bg-surface p-6">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Email</dt>
          <dd className="mt-1 font-mono text-foreground">{account.user.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Username</dt>
          <dd className="mt-1 font-mono text-foreground">{account.user.username}</dd>
        </div>
      </dl>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Don&apos;t sign up with a work email unless you must — you cannot change it later.
      </div>

      <form onSubmit={handleRename} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-foreground">New username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={account.user.username ?? ""}
            className="mt-2 w-full rounded-lg border border-border-strong bg-surface px-4 py-2.5 font-mono"
          />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {message && <p className="text-sm text-green-800">{message}</p>}
        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-surface disabled:opacity-50"
        >
          {loading ? "Saving…" : "Change username"}
        </button>
      </form>
    </div>
  );
}