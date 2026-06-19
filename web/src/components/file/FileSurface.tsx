"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useCallback, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { getErrorMessage } from "@/lib/errors";
import { FileAclPanel } from "./FileAclPanel";
import { FileBlameView } from "./FileBlameView";
import { FileDiffView } from "./FileDiffView";
import { FileHistoryPanel } from "./FileHistoryPanel";

type SurfaceTab = "diff" | "blame" | "acl";

export function FileSurface({
  projectId,
  fileId,
}: {
  projectId: Id<"files">;
  fileId: Id<"files">;
}) {
  const data = useQuery(api.queries.getFileWithContent, { fileId });
  const compare = useQuery(api.queries.getFileCompareContext, { fileId });
  const setCurrentVersion = useMutation(api.files.setCurrentVersion);

  const [tab, setTab] = useState<SurfaceTab>("diff");
  const [leftVersionId, setLeftVersionId] = useState<Id<"versions"> | undefined>();
  const [rightVersionId, setRightVersionId] = useState<Id<"versions"> | undefined>();
  const [blameVersionId, setBlameVersionId] = useState<Id<"versions"> | undefined>();
  const [rollbackError, setRollbackError] = useState<string | null>(null);
  const [rollingBack, setRollingBack] = useState(false);

  const handleSelectVersion = useCallback((versionId: Id<"versions">) => {
    setBlameVersionId(versionId);
    setTab("blame");
  }, []);

  const handleCompareWithCurrent = useCallback(
    (versionId: Id<"versions">) => {
      setLeftVersionId(versionId);
      setRightVersionId(undefined);
      setTab("diff");
    },
    [],
  );

  const handleRollback = useCallback(
    async (versionId: Id<"versions">) => {
      setRollingBack(true);
      setRollbackError(null);
      try {
        await setCurrentVersion({
          fileId,
          versionId,
          forked: false,
        });
      } catch (err) {
        setRollbackError(getErrorMessage(err, "Rollback failed"));
      } finally {
        setRollingBack(false);
      }
    },
    [fileId, setCurrentVersion],
  );

  if (data === undefined) {
    return <p className="text-stone-500">Loading file…</p>;
  }

  if (!data?.file) {
    return <p className="text-stone-500">File not found or access denied.</p>;
  }

  const file = data.file;

  if (file.mime && !String(file.mime).startsWith("text/")) {
    return (
      <p className="text-stone-600">
        Binary file ({String(file.mime)}). Open in the desktop mirror client.
      </p>
    );
  }

  const canWrite = compare?.canWrite ?? false;
  const rollbackTarget = blameVersionId ?? data.version?._id;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-stone-900">
              {String(file.name)}
            </h1>
            {file.forked && (
              <Link
                href={`/app/projects/${projectId}/files/${fileId}/merge`}
                className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800 hover:bg-amber-200"
              >
                forked — merge
              </Link>
            )}
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Read-only review surface. Edit in your local editor via the mirror at{" "}
            <code className="rounded bg-stone-100 px-1">$HOME/Projects</code>.
          </p>
        </div>

        {canWrite && rollbackTarget && rollbackTarget !== file.currentVersionId && (
          <button
            type="button"
            onClick={() => void handleRollback(rollbackTarget)}
            disabled={rollingBack}
            className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-900 hover:bg-amber-100 disabled:opacity-40"
          >
            {rollingBack ? "Rolling back…" : "Rollback to selected version"}
          </button>
        )}
      </div>

      {rollbackError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {rollbackError}
        </p>
      )}

      <div className="flex gap-1 border-b border-stone-200">
        {(["diff", "blame", "acl"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`px-4 py-2 text-sm capitalize ${
              tab === item
                ? "border-b-2 border-stone-900 font-medium text-stone-900"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            {item === "acl" ? "ACL" : item}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <FileHistoryPanel
          fileId={fileId}
          selectedVersionId={blameVersionId ?? data.version?._id}
          onSelectVersion={handleSelectVersion}
          onCompareWithCurrent={handleCompareWithCurrent}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {tab === "diff" && (
            <FileDiffView
              fileId={fileId}
              leftVersionId={leftVersionId}
              rightVersionId={rightVersionId}
              onLeftChange={setLeftVersionId}
              onRightChange={setRightVersionId}
            />
          )}
          {tab === "blame" && (
            <FileBlameView
              fileId={fileId}
              versionId={blameVersionId ?? data.version?._id}
            />
          )}
          {tab === "acl" && (
            <FileAclPanel
              fileId={fileId}
              properties={file.properties}
              canWrite={canWrite}
            />
          )}
        </div>
      </div>
    </div>
  );
}