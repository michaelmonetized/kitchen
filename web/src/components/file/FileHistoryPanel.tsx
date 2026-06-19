"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { formatVersionTimestamp } from "@/lib/file/formatVersion";

const PAGE_SIZE = 10;

export function FileHistoryPanel({
  fileId,
  selectedVersionId,
  onSelectVersion,
  onCompareWithCurrent,
}: {
  fileId: Id<"files">;
  selectedVersionId?: Id<"versions">;
  onSelectVersion: (versionId: Id<"versions">) => void;
  onCompareWithCurrent: (versionId: Id<"versions">) => void;
}) {
  const [extraPages, setExtraPages] = useState(0);
  const requested = PAGE_SIZE * (1 + extraPages);
  const versions = useQuery(api.queries.listVersions, {
    fileId,
    limit: requested,
    cursor: 0,
  });

  const visible = versions ?? [];
  const hasMore = visible.length === requested;

  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-hidden rounded-lg border border-stone-200 bg-white">
      <header className="border-b border-stone-200 px-3 py-2">
        <h2 className="text-sm font-medium text-stone-800">History</h2>
        <p className="text-xs text-stone-500">Last {PAGE_SIZE} versions</p>
      </header>
      <ul className="flex-1 overflow-auto text-sm">
        {visible.length === 0 && (
          <li className="px-3 py-4 text-stone-500">No versions yet.</li>
        )}
        {visible.map((version) => {
          const active = selectedVersionId === version._id;
          return (
            <li key={String(version._id)} className="border-b border-stone-100 last:border-0">
              <button
                type="button"
                onClick={() => onSelectVersion(version._id)}
                className={`w-full px-3 py-2 text-left hover:bg-stone-50 ${
                  active ? "bg-stone-100" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-stone-800">
                    {version.authorLabel}
                  </span>
                  {version.isCurrent && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-800">
                      current
                    </span>
                  )}
                </div>
                <time className="text-xs text-stone-500">
                  {formatVersionTimestamp(version._creationTime)}
                </time>
              </button>
              {!version.isCurrent && (
                <button
                  type="button"
                  onClick={() => onCompareWithCurrent(version._id)}
                  className="w-full px-3 pb-2 text-left text-xs text-stone-500 underline decoration-dotted hover:text-stone-800"
                >
                  Compare to current
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExtraPages((p) => p + 1)}
          className="border-t border-stone-200 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50"
        >
          Older versions…
        </button>
      )}
    </aside>
  );
}