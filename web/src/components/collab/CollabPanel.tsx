"use client";

import { useState } from "react";
import type { CollabSessionState } from "./useCollabSession";

export function CollabPanel({
  state,
  onStart,
  onJoin,
  onLeave,
  onCheckpoint,
  onRebase,
}: {
  state: CollabSessionState;
  onStart: () => void;
  onJoin: (sessionId: string) => void;
  onLeave: () => void;
  onCheckpoint: () => void;
  onRebase: () => void;
}) {
  const [joinId, setJoinId] = useState("");
  const inSession = state.connected && state.sessionId;

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-stone-800">Pair session</span>
          <a
            href="https://discord.com/channels/@me"
            target="_blank"
            rel="noopener noreferrer"
            title="Use Discord/Meet for voice"
            className="text-xs text-stone-500 underline decoration-dotted hover:text-stone-700"
          >
            Voice (external)
          </a>
        </div>
        {inSession ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCheckpoint}
              disabled={state.checkpointing || state.stale}
              className="rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-800 hover:bg-stone-100 disabled:opacity-40"
            >
              {state.checkpointing ? "Checkpointing…" : "Checkpoint now"}
            </button>
            <button
              type="button"
              onClick={onLeave}
              className="rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-800 hover:bg-stone-100"
            >
              Leave
            </button>
          </div>
        ) : null}
      </div>

      {!inSession ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onStart}
            className="rounded-md bg-stone-900 px-3 py-1.5 text-xs text-white hover:bg-stone-800"
          >
            Start pair session
          </button>
          <input
            type="text"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="Session ID"
            className="min-w-[12rem] rounded-md border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-900 outline-none focus:border-stone-500"
          />
          <button
            type="button"
            onClick={() => onJoin(joinId)}
            disabled={!joinId.trim()}
            className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-800 hover:bg-stone-100 disabled:opacity-40"
          >
            Join session
          </button>
        </div>
      ) : (
        <div className="mt-2 space-y-1 text-xs text-stone-600">
          <p>
            <span className="font-medium text-stone-700">Session:</span>{" "}
            <code className="rounded bg-white px-1 py-0.5 text-stone-800">
              {state.sessionId}
            </code>
            {state.isHost ? " (host)" : " (guest)"}
          </p>
          <p>
            <span className="font-medium text-stone-700">Participants:</span>{" "}
            {state.participants.length > 0
              ? state.participants.join(", ")
              : "waiting…"}
          </p>
          {state.lastCheckpointVersionId ? (
            <p>
              <span className="font-medium text-stone-700">Last checkpoint:</span>{" "}
              {state.lastCheckpointVersionId}
            </p>
          ) : null}
        </div>
      )}

      {state.stale ? (
        <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <p className="font-medium">Session stale</p>
          <p className="mt-0.5">
            {state.staleReason ??
              "Someone saved outside this session. Rebase from server or leave."}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onRebase}
              className="rounded-md bg-amber-800 px-2.5 py-1 text-white hover:bg-amber-900"
            >
              Rebase from server
            </button>
            <button
              type="button"
              onClick={onLeave}
              className="rounded-md border border-amber-400 bg-white px-2.5 py-1 hover:bg-amber-100"
            >
              End session
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}