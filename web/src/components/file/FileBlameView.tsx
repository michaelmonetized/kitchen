"use client";

import { useQuery } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { formatVersionTimestamp } from "@/lib/file/formatVersion";

export function FileBlameView({
  fileId,
  versionId,
}: {
  fileId: Id<"files">;
  versionId?: Id<"versions">;
}) {
  const blame = useQuery(api.queries.getFileBlame, { fileId, versionId });

  if (blame === undefined) {
    return <p className="text-stone-500">Loading blame…</p>;
  }

  if (!blame?.file) {
    return <p className="text-stone-500">File not found or access denied.</p>;
  }

  if (blame.lines.length === 0) {
    return (
      <p className="text-stone-600">
        No content to blame yet. Edit this file in your local editor via the mirror
        client.
      </p>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-stone-200">
      <header className="border-b border-stone-200 bg-stone-100 px-3 py-2 text-sm font-medium text-stone-800">
        Per-line blame
      </header>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="sticky top-0 bg-white text-stone-500">
            <tr>
              <th className="w-10 px-3 py-2 font-medium">#</th>
              <th className="w-36 px-3 py-2 font-medium">Author</th>
              <th className="w-40 px-3 py-2 font-medium">Version</th>
              <th className="px-3 py-2 font-medium">Line</th>
            </tr>
          </thead>
          <tbody>
            {blame.lines.map((line) => (
              <tr key={line.lineNumber} className="hover:bg-stone-50">
                <td className="px-3 py-1 align-top text-stone-400">
                  {line.lineNumber}
                </td>
                <td className="px-3 py-1 align-top text-stone-600">
                  {line.authorLabel}
                </td>
                <td className="px-3 py-1 align-top text-stone-500">
                  {formatVersionTimestamp(line.timestamp)}
                </td>
                <td className="whitespace-pre px-3 py-1 align-top text-stone-800">
                  {line.text}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}