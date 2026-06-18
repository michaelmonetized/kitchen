"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type CollabMessage,
  parseMessage,
  serializeMessage,
} from "@kitchen/collab-protocol";

const RELAY_URL =
  process.env.NEXT_PUBLIC_COLLAB_RELAY_URL ?? "ws://127.0.0.1:9473";

const CHECKPOINT_DEBOUNCE_MS = 2000;
const OP_DEBOUNCE_MS = 80;

export type CollabSessionState = {
  sessionId: string | null;
  connected: boolean;
  isHost: boolean;
  participants: string[];
  stale: boolean;
  staleReason: string | null;
  lastCheckpointVersionId: string | null;
  checkpointing: boolean;
};

const initialState: CollabSessionState = {
  sessionId: null,
  connected: false,
  isHost: false,
  participants: [],
  stale: false,
  staleReason: null,
  lastCheckpointVersionId: null,
  checkpointing: false,
};

export function useCollabSession({
  fileId,
  buffer,
  setBuffer,
  serverContent,
  serverVersionId,
  onCheckpointComplete,
}: {
  fileId: string;
  buffer: string;
  setBuffer: (value: string) => void;
  serverContent: string;
  serverVersionId: string | null | undefined;
  onCheckpointComplete?: (versionId: string) => void;
}) {
  const { userId } = useAuth();
  const clerkId = userId ?? "anonymous";

  const socketRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const lastSentRef = useRef(buffer);
  const opTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkpointTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionVersionRef = useRef<string | null | undefined>(serverVersionId);
  const lastCheckpointVersionRef = useRef<string | null>(null);
  const suppressRemoteRef = useRef(false);
  const connectedRef = useRef(false);
  const staleRef = useRef(false);

  const [state, setState] = useState<CollabSessionState>(initialState);

  const closeSocket = useCallback(() => {
    if (opTimerRef.current) clearTimeout(opTimerRef.current);
    if (checkpointTimerRef.current) clearTimeout(checkpointTimerRef.current);

    const socket = socketRef.current;
    const sessionId = sessionIdRef.current;
    if (socket?.readyState === WebSocket.OPEN && sessionId) {
      socket.send(
        serializeMessage({
          type: "session.leave",
          sessionId,
          userId: clerkId,
        })
      );
    }
    socket?.close();
    socketRef.current = null;
    sessionIdRef.current = null;
    connectedRef.current = false;
  }, [clerkId]);

  const disconnect = useCallback(() => {
    closeSocket();
    staleRef.current = false;
    setState(initialState);
  }, [closeSocket]);

  const emitOp = useCallback(
    (content: string) => {
      const socket = socketRef.current;
      const sessionId = sessionIdRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN || !sessionId) return;
      if (content === lastSentRef.current) return;
      lastSentRef.current = content;
      socket.send(
        serializeMessage({
          type: "op.apply",
          sessionId,
          seq: 0,
          userId: clerkId,
          content,
        })
      );
    },
    [clerkId]
  );

  const sendCheckpoint = useCallback(() => {
    const socket = socketRef.current;
    const sessionId = sessionIdRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !sessionId) return;
    setState((s) => ({ ...s, checkpointing: true }));
    socket.send(
      serializeMessage({
        type: "checkpoint",
        sessionId,
        userId: clerkId,
      })
    );
  }, [clerkId]);

  const scheduleCheckpoint = useCallback(() => {
    if (checkpointTimerRef.current) clearTimeout(checkpointTimerRef.current);
    checkpointTimerRef.current = setTimeout(sendCheckpoint, CHECKPOINT_DEBOUNCE_MS);
  }, [sendCheckpoint]);

  const checkpointNow = useCallback(() => {
    if (checkpointTimerRef.current) clearTimeout(checkpointTimerRef.current);
    sendCheckpoint();
  }, [sendCheckpoint]);

  const reportStale = useCallback((reason: string) => {
    const socket = socketRef.current;
    const sessionId = sessionIdRef.current;
    staleRef.current = true;
    if (!socket || socket.readyState !== WebSocket.OPEN || !sessionId) {
      setState((s) => ({ ...s, stale: true, staleReason: reason }));
      return;
    }
    socket.send(
      serializeMessage({
        type: "session.reportStale",
        sessionId,
        reason,
      })
    );
  }, []);

  const connect = useCallback(
    (sessionId: string, isHost: boolean, initialContent: string) => {
      closeSocket();
      staleRef.current = false;
      sessionVersionRef.current = serverVersionId;
      lastCheckpointVersionRef.current = null;
      lastSentRef.current = initialContent;
      sessionIdRef.current = sessionId;

      const socket = new WebSocket(RELAY_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        const msg: CollabMessage = isHost
          ? {
              type: "session.start",
              sessionId,
              filePath: fileId,
              userId: clerkId,
            }
          : {
              type: "session.join",
              sessionId,
              userId: clerkId,
            };
        socket.send(serializeMessage(msg));
        if (isHost) {
          socket.send(
            serializeMessage({
              type: "op.apply",
              sessionId,
              seq: 0,
              userId: clerkId,
              content: initialContent,
            })
          );
        }
        connectedRef.current = true;
        setState({
          sessionId,
          connected: true,
          isHost,
          participants: [clerkId],
          stale: false,
          staleReason: null,
          lastCheckpointVersionId: null,
          checkpointing: false,
        });
      };

      socket.onmessage = (event) => {
        const msg = parseMessage(String(event.data));
        if (!msg) return;

        switch (msg.type) {
          case "session.start":
          case "session.join": {
            setState((s) => {
              const next = new Set(s.participants);
              next.add(msg.userId);
              return { ...s, participants: [...next] };
            });
            break;
          }
          case "session.leave": {
            setState((s) => ({
              ...s,
              participants: s.participants.filter((p) => p !== msg.userId),
            }));
            break;
          }
          case "op.apply": {
            if (msg.userId === clerkId) break;
            suppressRemoteRef.current = true;
            setBuffer(msg.content);
            lastSentRef.current = msg.content;
            suppressRemoteRef.current = false;
            break;
          }
          case "checkpoint.complete": {
            suppressRemoteRef.current = true;
            setBuffer(msg.content);
            lastSentRef.current = msg.content;
            lastCheckpointVersionRef.current = msg.versionId;
            sessionVersionRef.current = msg.versionId;
            suppressRemoteRef.current = false;
            setState((s) => ({
              ...s,
              checkpointing: false,
              lastCheckpointVersionId: msg.versionId,
            }));
            onCheckpointComplete?.(msg.versionId);
            break;
          }
          case "session.stale": {
            staleRef.current = true;
            setState((s) => ({
              ...s,
              stale: true,
              staleReason: msg.reason,
            }));
            break;
          }
          case "error": {
            console.error("collab error:", msg.message);
            break;
          }
          default:
            break;
        }
      };

      socket.onclose = () => {
        connectedRef.current = false;
        setState((s) => ({ ...s, connected: false }));
      };
    },
    [clerkId, closeSocket, fileId, onCheckpointComplete, serverVersionId, setBuffer]
  );

  const startSession = useCallback(() => {
    connect(crypto.randomUUID(), true, buffer);
  }, [buffer, connect]);

  const joinSession = useCallback(
    (sessionId: string) => {
      const trimmed = sessionId.trim();
      if (!trimmed) return;
      connect(trimmed, false, buffer);
    },
    [buffer, connect]
  );

  const onLocalEdit = useCallback(
    (content: string) => {
      if (!connectedRef.current || staleRef.current) return;
      if (opTimerRef.current) clearTimeout(opTimerRef.current);
      opTimerRef.current = setTimeout(() => emitOp(content), OP_DEBOUNCE_MS);
      scheduleCheckpoint();
    },
    [emitOp, scheduleCheckpoint]
  );

  const rebaseFromServer = useCallback(() => {
    setBuffer(serverContent);
    lastSentRef.current = serverContent;
    sessionVersionRef.current = serverVersionId;
    staleRef.current = false;
    setState((s) => ({ ...s, stale: false, staleReason: null }));
    if (connectedRef.current && sessionIdRef.current) {
      emitOp(serverContent);
    }
  }, [emitOp, serverContent, serverVersionId, setBuffer]);

  useEffect(() => {
    if (!connectedRef.current || staleRef.current) return;
    if (suppressRemoteRef.current) return;
    if (serverVersionId === undefined) return;
    if (serverVersionId === sessionVersionRef.current) return;
    if (serverVersionId === lastCheckpointVersionRef.current) return;

    reportStale("External save detected — session is stale");
  }, [reportStale, serverVersionId, state.connected, state.stale]);

  useEffect(() => () => closeSocket(), [closeSocket]);

  return {
    relayUrl: RELAY_URL,
    state,
    startSession,
    joinSession,
    disconnect,
    checkpointNow,
    onLocalEdit,
    rebaseFromServer,
  };
}