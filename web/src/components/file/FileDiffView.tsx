"use client";

import { useQuery } from "convex/react";
import { useMemo } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { buildMergeRows } from "@/lib/merge/diffLinePick";
import { formatVersionLabel } from "@/lib/file/formatVersion";
import { parseVersionId } from "@/lib/convex-id";

function rowBg(kind: "equal" | "left" | "right" | "conflict") {
  switch (kind) {
    case "equal":
      return "bg-stone-50";
    case "left":
      return "bg-sky-50";
    case "right":
      return "bg-emerald-50";
    case "conflict":
      return "bg-amber-50";
  }
}

export function FileDiffView({
  fileId,
  leftVersionId,
  rightVersionId,
  onLeftChange,
  onRightChange,
}: {
  fileId: Id<"files">;
  leftVersionId?: Id<"versions">;
  rightVersionId?: Id<"versions">;
  onLeftChange: (versionId: Id<"versions">) => void;
  onRightChange: (versionId: Id<"versions">) => void;
}) {
  const context = useQuery(api.queries.getFileCompareContext, {
    fileId,
    leftVersionId,
    rightVersionId,
  });

  const rows = useMemo(() => {
    if (!context?.left || !context?.right) return [];
    return buildMergeRows(context.left.content, context.right.content);
  }, [context?.left, context?.right]);

  if (context === undefined) {
    return <p className="text-stone-500">Loading diff…</p>;
  }

  if (!context?.file) {
    return <p className="text-stone-500">File not found or access denied.</p>;
  }

  const { versions, left, right } = context;

  if (versions.length === 0) {
    return (
      <p className="text-stone-600">
        No versions yet. Edit this file in your local editor via the mirror client.
      </p>
    );
  }

  const leftIndex = left ? versions.findIndex((v) => v._id === left._id) : -1;
  const rightIndex = right ? versions.findIndex((v) => v._id === right._id) : -1;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {versions.length > 1 && (
        <div className="flex flex-wrap gap-4 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-stone-600">Left</span>
            <select
              value={leftVersionId ?? (left ? String(left._id) : "")}
              onChange={(e) => {
                const id = parseVersionId(e.target.value);
                if (id) onLeftChange(id);
              }}
              className="rounded border border-stone-200 bg-white px-2 py-1"
            >
              {versions.map((ver, i) => (
                <option key={String(ver._id)} value={String(ver._id)}>
                  {formatVersionLabel(
                    i,
                    ver._creationTime,
                    String(ver._id),
                    ver.authorLabel,
                  )}
                  {ver.isCurrent ? " (current)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-stone-600">Right</span>
            <select
              value={rightVersionId ?? (right ? String(right._id) : "")}
              onChange={(e) => {
                const id = parseVersionId(e.target.value);
                if (id) onRightChange(id);
              }}
              className="rounded border border-stone-200 bg-white px-2 py-1"
            >
              {versions.map((ver, i) => (
                <option key={String(ver._id)} value={String(ver._id)}>
                  {formatVersionLabel(
                    i,
                    ver._creationTime,
                    String(ver._id),
                    ver.authorLabel,
                  )}
                  {ver.isCurrent ? " (current)" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="flex min-h-[200px] flex-col overflow-hidden rounded-lg border border-stone-200">
          <header className="border-b border-stone-200 bg-sky-50 px-3 py-2 text-sm font-medium text-stone-800">
            {left && leftIndex >= 0
              ? formatVersionLabel(
                  leftIndex,
                  left._creationTime,
                  String(left._id),
                  left.authorLabel,
                )
              : "Left"}
          </header>
          <pre className="flex-1 overflow-auto p-3 font-mono text-xs leading-relaxed text-stone-800">
            {left?.content ?? ""}
          </pre>
        </section>

        <section className="flex min-h-[200px] flex-col overflow-hidden rounded-lg border border-stone-200">
          <header className="border-b border-stone-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-stone-800">
            {right && rightIndex >= 0
              ? formatVersionLabel(
                  rightIndex,
                  right._creationTime,
                  String(right._id),
                  right.authorLabel,
                )
              : "Right"}
          </header>
          <pre className="flex-1 overflow-auto p-3 font-mono text-xs leading-relaxed text-stone-800">
            {right?.content ?? ""}
          </pre>
        </section>
      </div>

      {left && right && rows.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-stone-200">
          <header className="border-b border-stone-200 bg-stone-100 px-3 py-2 text-sm font-medium text-stone-800">
            Line diff
          </header>
          <div className="max-h-64 overflow-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="sticky top-0 bg-white text-stone-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Left</th>
                  <th className="px-3 py-2 font-medium">Right</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className={rowBg(row.kind)}>
                    <td className="whitespace-pre px-3 py-1 align-top text-stone-800">
                      {row.left ?? ""}
                    </td>
                    <td className="whitespace-pre px-3 py-1 align-top text-stone-800">
                      {row.right ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}