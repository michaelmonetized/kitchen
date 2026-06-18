"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { CollabPanel } from "../collab/CollabPanel";
import { useCollabSession } from "../collab/useCollabSession";
import { encodeTextContent } from "@/lib/content";
import { getErrorMessage } from "@/lib/errors";
import { ForkMergeModal } from "./ForkMergeModal";

export function FileEditor({
  projectId,
  fileId,
}: {
  projectId: string;
  fileId: string;
}) {
  const data = useQuery(api.queries.getFileWithContent, {
    fileId: fileId as Id<"files">,
  });
  const insertVersion = useMutation(api.versions.insert);
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showForkModal, setShowForkModal] = useState(false);
  const forkedBeforeSaveRef = useRef(false);
  const awaitingForkCheckRef = useRef(false);

  const serverContent = data?.content ?? "";
  const dirty = draft !== null;
  const buffer = draft ?? serverContent;

  const {
    state: collabState,
    startSession,
    joinSession,
    disconnect: leaveCollab,
    checkpointNow,
    onLocalEdit,
    rebaseFromServer,
  } = useCollabSession({
    fileId,
    buffer,
    setBuffer: (value) => setDraft(value),
    serverContent,
    serverVersionId: data?.version?._id,
    onCheckpointComplete: () => setDraft(null),
  });

  const inCollab = collabState.connected && !collabState.stale;

  const save = useCallback(async () => {
    if (inCollab) {
      checkpointNow();
      return;
    }
    forkedBeforeSaveRef.current = Boolean(data?.file?.forked);
    awaitingForkCheckRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      await insertVersion({
        fileId: fileId as Id<"files">,
        content: encodeTextContent(buffer),
      });
      setDraft(null);
    } catch (err) {
      setSaveError(getErrorMessage(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  }, [
    buffer,
    checkpointNow,
    data?.file?.forked,
    fileId,
    inCollab,
    insertVersion,
  ]);

  useEffect(() => {
    if (!awaitingForkCheckRef.current) return;
    if (data === undefined || data === null) return;
    awaitingForkCheckRef.current = false;
    if (data.file?.forked && !forkedBeforeSaveRef.current) {
      setShowForkModal(true);
    }
  }, [data]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

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

  return (
    <div className="flex h-full flex-col gap-3">
      {saveError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p>
      )}
      <CollabPanel
        state={collabState}
        onStart={startSession}
        onJoin={joinSession}
        onLeave={leaveCollab}
        onCheckpoint={checkpointNow}
        onRebase={rebaseFromServer}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-stone-900">{String(file.name)}</span>
          {file.forked && (
            <Link
              href={`/app/projects/${projectId}/files/${fileId}/merge`}
              className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800 hover:bg-amber-200"
            >
              forked — merge
            </Link>
          )}
          {inCollab ? (
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
              pairing live
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={(!dirty && !inCollab) || saving || collabState.stale}
          className="rounded-md bg-stone-900 px-3 py-1.5 text-sm text-white disabled:opacity-40"
        >
          {saving || collabState.checkpointing
            ? "Saving…"
            : inCollab
              ? "Checkpoint"
              : dirty
                ? "Save"
                : "Saved"}
        </button>
      </div>
      <textarea
        value={buffer}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          onLocalEdit(next);
        }}
        disabled={collabState.stale}
        className="min-h-[60vh] flex-1 resize-none rounded-lg border border-stone-200 bg-white p-4 font-mono text-sm leading-relaxed text-stone-900 outline-none focus:border-stone-400 disabled:bg-stone-50"
        spellCheck={false}
      />
      {showForkModal && (
        <ForkMergeModal
          projectId={projectId}
          fileId={fileId}
          onClose={() => setShowForkModal(false)}
        />
      )}
    </div>
  );
}