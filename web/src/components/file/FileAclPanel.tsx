"use client";

import { useMutation } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { getErrorMessage } from "@/lib/errors";

const DEFAULT_ACL = {
  "role:editor": "write",
  "role:viewer": "read",
} as const;

export function FileAclPanel({
  fileId,
  properties,
  canWrite,
}: {
  fileId: Id<"files">;
  properties: Record<string, string>;
  canWrite: boolean;
}) {
  const updateMetadata = useMutation(api.files.updateMetadata);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roleProps = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(properties).filter(([key]) => key.startsWith("role:")),
      ),
    [properties],
  );

  useEffect(() => {
    setDraft(JSON.stringify(roleProps, null, 2));
  }, [roleProps]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    try {
      const parsed = JSON.parse(draft) as Record<string, string>;
      for (const key of Object.keys(parsed)) {
        if (!key.startsWith("role:")) {
          throw new Error('ACL keys must start with "role:"');
        }
      }
      const merged = { ...properties };
      for (const key of Object.keys(merged)) {
        if (key.startsWith("role:")) delete merged[key];
      }
      await updateMetadata({
        fileId,
        properties: { ...merged, ...parsed },
      });
      setStatus("File ACL updated.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update ACL"));
    }
  }

  async function handleReset() {
    setDraft(JSON.stringify(DEFAULT_ACL, null, 2));
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4">
      <h2 className="text-sm font-medium text-stone-800">File ACL</h2>
      <p className="mt-1 text-xs text-stone-500">
        Override project defaults with file-level <code>role:*</code> properties.
        Inherited properties from parent dirs still apply.
      </p>

      {!canWrite ? (
        <pre className="mt-4 rounded bg-stone-50 px-3 py-2 font-mono text-xs text-stone-600">
          {JSON.stringify(roleProps, null, 2) || "{}"}
        </pre>
      ) : (
        <form onSubmit={(e) => void handleSave(e)} className="mt-4 space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            spellCheck={false}
            className="w-full rounded-md border border-stone-200 bg-stone-50 p-3 font-mono text-xs text-stone-800 outline-none focus:border-stone-400"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-md bg-stone-900 px-3 py-1.5 text-sm text-white hover:bg-stone-800"
            >
              Save ACL
            </button>
            <button
              type="button"
              onClick={() => void handleReset()}
              className="rounded-md border border-stone-200 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
            >
              Reset to defaults
            </button>
          </div>
        </form>
      )}

      {status && <p className="mt-2 text-sm text-emerald-700">{status}</p>}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </section>
  );
}