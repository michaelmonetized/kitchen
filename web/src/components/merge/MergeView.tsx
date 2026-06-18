"use client";

/**
 * Pierre npm package is not integrated in v0 — this view uses the `diff` package
 * plus a line-pick state machine as the human-merge fallback described in
 * docs/reference/pierre-integration.md. Swap the diff table for Pierre primitives
 * when a suitable package is available.
 */

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

type VersionHead = {
  _id: Id<"versions">;
  _creationTime: number;
  content: string;
};
import {
  buildMergeRows,
  composeMergedContent,
  type MergeRow,
  type PickSide,
} from "@/lib/merge/diffLinePick";
import { encodeTextContent } from "@/lib/content";
import { getErrorMessage } from "@/lib/errors";

const PICK_OPTIONS: PickSide[] = ["left", "right", "both", "skip"];

function formatVersionLabel(
  index: number,
  creationTime: number,
  versionId: string,
) {
  const when = new Date(creationTime).toLocaleString();
  return `Version ${String.fromCharCode(65 + index)} · ${when} · ${versionId.slice(-6)}`;
}

function rowBg(kind: MergeRow["kind"]) {
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

function MergeLinePicker({
  left,
  right,
  onPreviewChange,
}: {
  left: VersionHead;
  right: VersionHead;
  onPreviewChange: (value: string) => void;
}) {
  const [rows, setRows] = useState(() =>
    buildMergeRows(left.content, right.content),
  );

  const computedPreview = useMemo(() => composeMergedContent(rows), [rows]);

  useEffect(() => {
    onPreviewChange(computedPreview);
  }, [computedPreview, onPreviewChange]);

  const setPick = useCallback((rowId: string, pick: PickSide) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, pick } : row)),
    );
  }, []);

  return (
    <>
      <section className="overflow-hidden rounded-lg border border-stone-200">
        <header className="border-b border-stone-200 bg-stone-100 px-3 py-2 text-sm font-medium text-stone-800">
          Line pick
        </header>
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="sticky top-0 bg-white text-stone-500">
              <tr>
                <th className="px-3 py-2 font-medium">Left</th>
                <th className="px-3 py-2 font-medium">Pick</th>
                <th className="px-3 py-2 font-medium">Right</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={rowBg(row.kind)}>
                  <td className="whitespace-pre px-3 py-1 align-top text-stone-800">
                    {row.left ?? ""}
                  </td>
                  <td className="px-3 py-1 align-top">
                    {row.kind === "equal" ? (
                      <span className="text-stone-500">both</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {PICK_OPTIONS.map((pick) => (
                          <button
                            key={pick}
                            type="button"
                            onClick={() => setPick(row.id, pick)}
                            className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                              row.pick === pick
                                ? "bg-stone-900 text-white"
                                : "bg-white text-stone-600 ring-1 ring-stone-200"
                            }`}
                          >
                            {pick}
                          </button>
                        ))}
                      </div>
                    )}
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

      <section className="overflow-hidden rounded-lg border border-stone-200">
        <header className="border-b border-stone-200 bg-stone-100 px-3 py-2 text-sm font-medium text-stone-800">
          Preview
        </header>
        <pre className="max-h-48 overflow-auto p-3 font-mono text-xs leading-relaxed text-stone-800">
          {computedPreview}
        </pre>
      </section>
    </>
  );
}

export function MergeView({
  projectId,
  fileId,
}: {
  projectId: string;
  fileId: Id<"files">;
}) {
  const [leftVersionId, setLeftVersionId] = useState<string | undefined>();
  const [rightVersionId, setRightVersionId] = useState<string | undefined>();
  const [preview, setPreview] = useState("");
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const context = useQuery(api.queries.getForkMergeContext, {
    fileId,
    leftVersionId: leftVersionId
      ? (leftVersionId as Id<"versions">)
      : undefined,
    rightVersionId: rightVersionId
      ? (rightVersionId as Id<"versions">)
      : undefined,
  });

  const insertMerge = useMutation(api.versions.insertMerge);

  const left = (context?.left ?? null) as VersionHead | null;
  const right = (context?.right ?? null) as VersionHead | null;
  const heads = (context?.heads ?? []) as VersionHead[];

  const commit = useCallback(async () => {
    if (!left || !right) return;
    setCommitting(true);
    setError(null);
    try {
      await insertMerge({
        fileId,
        content: encodeTextContent(preview),
        parentVersionIds: [left._id, right._id],
      });
      router.push(`/app/projects/${projectId}/files/${fileId}`);
    } catch (e) {
      setError(getErrorMessage(e, "Merge failed"));
    } finally {
      setCommitting(false);
    }
  }, [fileId, insertMerge, left, preview, projectId, right, router]);

  if (context === undefined) {
    return <p className="text-stone-500">Loading merge context…</p>;
  }

  if (!context?.file) {
    return (
      <p className="text-stone-500">File not found or access denied.</p>
    );
  }

  const file = context.file;

  if (heads.length < 2) {
    return (
      <div className="space-y-4">
        <p className="text-stone-600">
          This file needs at least two version heads to merge. Current heads:{" "}
          {heads.length}.
        </p>
        <Link
          href={`/app/projects/${projectId}/files/${fileId}`}
          className="text-sm text-stone-700 underline"
        >
          Back to editor
        </Link>
      </div>
    );
  }

  const leftIndex = heads.findIndex((h) => h._id === left?._id);
  const rightIndex = heads.findIndex((h) => h._id === right?._id);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">
            Merge {String(file.name)}
          </h2>
          <p className="text-sm text-stone-500">
            Pick lines from left, right, or both — then preview and commit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/app/projects/${projectId}/files/${fileId}`}
            className="rounded-md border border-stone-200 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={() => void commit()}
            disabled={committing || !left || !right}
            className="rounded-md bg-stone-900 px-3 py-1.5 text-sm text-white disabled:opacity-40"
          >
            {committing ? "Committing…" : "Commit merge"}
          </button>
        </div>
      </div>

      {heads.length > 2 && (
        <div className="flex flex-wrap gap-4 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-stone-600">Left pane</span>
            <select
              value={leftVersionId ?? String(left?._id ?? "")}
              onChange={(e) => setLeftVersionId(e.target.value)}
              className="rounded border border-stone-200 bg-white px-2 py-1"
            >
              {heads.map((head, i) => (
                <option key={String(head._id)} value={String(head._id)}>
                  {formatVersionLabel(i, head._creationTime, String(head._id))}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-stone-600">Right pane</span>
            <select
              value={rightVersionId ?? String(right?._id ?? "")}
              onChange={(e) => setRightVersionId(e.target.value)}
              className="rounded border border-stone-200 bg-white px-2 py-1"
            >
              {heads.map((head, i) => (
                <option key={String(head._id)} value={String(head._id)}>
                  {formatVersionLabel(i, head._creationTime, String(head._id))}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="flex min-h-[240px] flex-col overflow-hidden rounded-lg border border-stone-200">
          <header className="border-b border-stone-200 bg-sky-50 px-3 py-2 text-sm font-medium text-stone-800">
            {left && leftIndex >= 0
              ? formatVersionLabel(
                  leftIndex,
                  left._creationTime,
                  String(left._id),
                )
              : "Left version"}
          </header>
          <pre className="flex-1 overflow-auto p-3 font-mono text-xs leading-relaxed text-stone-800">
            {left?.content ?? ""}
          </pre>
        </section>

        <section className="flex min-h-[240px] flex-col overflow-hidden rounded-lg border border-stone-200">
          <header className="border-b border-stone-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-stone-800">
            {right && rightIndex >= 0
              ? formatVersionLabel(
                  rightIndex,
                  right._creationTime,
                  String(right._id),
                )
              : "Right version"}
          </header>
          <pre className="flex-1 overflow-auto p-3 font-mono text-xs leading-relaxed text-stone-800">
            {right?.content ?? ""}
          </pre>
        </section>
      </div>

      {left && right && (
        <MergeLinePicker
          key={`${String(left._id)}-${String(right._id)}`}
          left={left}
          right={right}
          onPreviewChange={setPreview}
        />
      )}
    </div>
  );
}