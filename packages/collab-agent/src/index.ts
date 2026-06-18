import { readFileSync, writeFileSync, watch } from "node:fs";
import { randomUUID } from "node:crypto";
import WebSocket from "ws";
import {
  type CollabMessage,
  parseMessage,
  serializeMessage,
} from "@kitchen/collab-protocol";

export type CollabAgentOptions = {
  relayUrl: string;
  filePath: string;
  userId: string;
  sessionId?: string;
  debounceMs?: number;
  onCheckpoint?: (versionId: string, content: string) => void;
};

export class CollabAgent {
  private readonly relayUrl: string;
  private readonly filePath: string;
  private readonly userId: string;
  private readonly sessionId: string;
  private readonly debounceMs: number;
  private readonly onCheckpoint?: (versionId: string, content: string) => void;

  private socket: WebSocket | null = null;
  private watcher: ReturnType<typeof watch> | null = null;
  private suppressEchoUntil = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSent = "";

  constructor(options: CollabAgentOptions) {
    this.relayUrl = options.relayUrl;
    this.filePath = options.filePath;
    this.userId = options.userId;
    this.sessionId = options.sessionId ?? randomUUID();
    this.debounceMs = options.debounceMs ?? 50;
    this.onCheckpoint = options.onCheckpoint;
  }

  get id(): string {
    return this.sessionId;
  }

  async connect(isHost: boolean): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.socket = new WebSocket(this.relayUrl);
      this.socket.on("open", () => {
        const msg: CollabMessage = isHost
          ? {
              type: "session.start",
              sessionId: this.sessionId,
              filePath: this.filePath,
              userId: this.userId,
            }
          : {
              type: "session.join",
              sessionId: this.sessionId,
              userId: this.userId,
            };
        this.socket?.send(serializeMessage(msg));
        resolve();
      });
      this.socket.on("error", reject);
      this.socket.on("message", (data) => this.onMessage(data.toString()));
    });

    this.watcher = watch(this.filePath, () => this.onLocalChange());
    this.lastSent = readFileSync(this.filePath, "utf8");
  }

  async disconnect(): Promise<void> {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.watcher?.close();
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(
        serializeMessage({
          type: "session.leave",
          sessionId: this.sessionId,
          userId: this.userId,
        })
      );
    }
    this.socket?.close();
    this.socket = null;
  }

  checkpoint(): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(
      serializeMessage({
        type: "checkpoint",
        sessionId: this.sessionId,
        userId: this.userId,
      })
    );
  }

  private onMessage(raw: string): void {
    const msg = parseMessage(raw);
    if (!msg) return;

    if (msg.type === "op.apply" && msg.userId !== this.userId) {
      this.applyRemote(msg.content);
      return;
    }

    if (msg.type === "checkpoint.complete") {
      this.applyRemote(msg.content);
      this.onCheckpoint?.(msg.versionId, msg.content);
    }
  }

  private onLocalChange(): void {
    if (Date.now() < this.suppressEchoUntil) return;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.emitLocalOp(), this.debounceMs);
  }

  private emitLocalOp(): void {
    const content = readFileSync(this.filePath, "utf8");
    if (content === this.lastSent) return;
    this.lastSent = content;
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(
      serializeMessage({
        type: "op.apply",
        sessionId: this.sessionId,
        seq: 0,
        userId: this.userId,
        content,
      })
    );
  }

  private applyRemote(content: string): void {
    if (content === readFileSync(this.filePath, "utf8")) {
      this.lastSent = content;
      return;
    }
    this.suppressEchoUntil = Date.now() + 200;
    writeFileSync(this.filePath, content, "utf8");
    this.lastSent = content;
  }
}