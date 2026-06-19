"use client";

import Link from "next/link";
import type { Id } from "../../../convex/_generated/dataModel";

export function ForkMergeModal({
  projectId,
  fileId,
  onClose,
}: {
  projectId: Id<"files">;
  fileId: Id<"files">;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fork-merge-title"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2
          id="fork-merge-title"
          className="text-lg font-semibold text-stone-900"
        >
          Fork detected
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          This file has concurrent version heads. Open the merge view to pick
          lines and compose a merged version.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-stone-200 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
          >
            Dismiss
          </button>
          <Link
            href={`/app/projects/${projectId}/files/${fileId}/merge`}
            className="rounded-md bg-stone-900 px-3 py-1.5 text-sm text-white"
          >
            Open merge view
          </Link>
        </div>
      </div>
    </div>
  );
}