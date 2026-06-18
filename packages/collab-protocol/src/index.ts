export type CollabMessage =
  | { type: "session.start"; sessionId: string; filePath: string; userId: string }
  | { type: "session.join"; sessionId: string; userId: string }
  | { type: "session.leave"; sessionId: string; userId: string }
  | { type: "op.apply"; sessionId: string; seq: number; userId: string; content: string }
  | { type: "checkpoint"; sessionId: string; userId: string }
  | { type: "checkpoint.complete"; sessionId: string; versionId: string; content: string }
  | { type: "session.stale"; sessionId: string; reason: string }
  | { type: "session.reportStale"; sessionId: string; reason: string }
  | { type: "error"; message: string };

export type ReplaceOp = {
  kind: "replace";
  content: string;
};

export function parseMessage(raw: string): CollabMessage | null {
  try {
    return JSON.parse(raw) as CollabMessage;
  } catch {
    return null;
  }
}

export function serializeMessage(msg: CollabMessage): string {
  return JSON.stringify(msg);
}