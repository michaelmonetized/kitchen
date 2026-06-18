import { WebSocketServer, WebSocket } from "ws";
import {
  type CollabMessage,
  parseMessage,
  serializeMessage,
} from "@kitchen/collab-protocol";

export type SessionState = {
  sessionId: string;
  filePath: string;
  content: string;
  seq: number;
  participants: Set<string>;
  sockets: Set<WebSocket>;
  versionCounter: number;
};

export type CheckpointContext = {
  sessionId: string;
  filePath: string;
  content: string;
  userId: string;
};

export type CollabRelayOptions = {
  port?: number;
  host?: string;
  onCheckpoint?: (ctx: CheckpointContext) => Promise<string | null>;
};

export class CollabRelay {
  readonly sessions = new Map<string, SessionState>();
  private server: WebSocketServer | null = null;
  private readonly port: number;
  private readonly host: string;
  private readonly onCheckpoint?: (
    ctx: CheckpointContext
  ) => Promise<string | null>;

  constructor(options: CollabRelayOptions = {}) {
    this.port = options.port ?? 9473;
    this.host = options.host ?? "127.0.0.1";
    this.onCheckpoint = options.onCheckpoint;
  }

  get boundPort(): number {
    const addr = this.server?.address();
    if (!addr || typeof addr === "string") return this.port;
    return addr.port;
  }

  get url(): string {
    return `ws://${this.host}:${this.boundPort}`;
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = new WebSocketServer({ host: this.host, port: this.port });
      this.server.on("connection", (socket) => this.onConnection(socket));
      this.server.on("listening", () => resolve());
    });
  }

  async stop(): Promise<void> {
    for (const session of this.sessions.values()) {
      for (const socket of session.sockets) {
        socket.close();
      }
    }
    this.sessions.clear();
    await new Promise<void>((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close((err) => (err ? reject(err) : resolve()));
    });
    this.server = null;
  }

  private onConnection(socket: WebSocket): void {
    let userId = `user-${Math.random().toString(36).slice(2, 8)}`;
    let sessionId: string | null = null;

    socket.on("message", (data) => {
      const msg = parseMessage(data.toString());
      if (!msg) {
        socket.send(serializeMessage({ type: "error", message: "invalid json" }));
        return;
      }

      switch (msg.type) {
        case "session.start": {
          userId = msg.userId;
          sessionId = msg.sessionId;
          let session = this.sessions.get(sessionId);
          if (!session) {
            session = {
              sessionId,
              filePath: msg.filePath,
              content: "",
              seq: 0,
              participants: new Set(),
              sockets: new Set(),
              versionCounter: 0,
            };
            this.sessions.set(sessionId, session);
          }
          session.participants.add(userId);
          session.sockets.add(socket);
          this.broadcast(session, msg);
          break;
        }
        case "session.join": {
          userId = msg.userId;
          sessionId = msg.sessionId;
          const session = this.sessions.get(sessionId);
          if (!session) {
            socket.send(
              serializeMessage({ type: "error", message: "session not found" })
            );
            return;
          }
          session.participants.add(userId);
          session.sockets.add(socket);
          this.broadcast(session, msg);
          if (session.content) {
            this.broadcast(session, {
              type: "op.apply",
              sessionId,
              seq: session.seq,
              userId: "relay",
              content: session.content,
            });
          }
          break;
        }
        case "op.apply": {
          const session = this.sessions.get(msg.sessionId);
          if (!session) return;
          sessionId = msg.sessionId;
          session.sockets.add(socket);
          session.seq += 1;
          session.content = msg.content;
          this.broadcast(session, { ...msg, seq: session.seq });
          break;
        }
        case "checkpoint": {
          const session = this.sessions.get(msg.sessionId);
          if (!session) return;
          void this.completeCheckpoint(session, msg.sessionId, msg.userId);
          break;
        }
        case "session.reportStale": {
          const session = this.sessions.get(msg.sessionId);
          if (!session) return;
          this.broadcast(session, {
            type: "session.stale",
            sessionId: msg.sessionId,
            reason: msg.reason,
          });
          break;
        }
        case "session.leave": {
          const session = this.sessions.get(msg.sessionId);
          if (!session) return;
          session.participants.delete(msg.userId);
          session.sockets.delete(socket);
          this.broadcast(session, msg);
          if (session.participants.size === 0) {
            this.sessions.delete(msg.sessionId);
          }
          break;
        }
        default:
          break;
      }
    });

    socket.on("close", () => {
      if (!sessionId) return;
      const session = this.sessions.get(sessionId);
      if (!session) return;
      session.sockets.delete(socket);
      session.participants.delete(userId);
      if (session.participants.size === 0) {
        this.sessions.delete(sessionId);
      }
    });
  }

  private async completeCheckpoint(
    session: SessionState,
    sessionId: string,
    userId: string
  ): Promise<void> {
    let versionId: string;
    if (this.onCheckpoint) {
      const remote = await this.onCheckpoint({
        sessionId,
        filePath: session.filePath,
        content: session.content,
        userId,
      });
      if (remote) {
        versionId = remote;
      } else {
        session.versionCounter += 1;
        versionId = `v${session.versionCounter}`;
      }
    } else {
      session.versionCounter += 1;
      versionId = `v${session.versionCounter}`;
    }

    const complete: CollabMessage = {
      type: "checkpoint.complete",
      sessionId,
      versionId,
      content: session.content,
    };
    this.broadcast(session, complete);
  }

  private broadcast(session: SessionState, msg: CollabMessage): void {
    const payload = serializeMessage(msg);
    for (const socket of session.sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    }
  }
}

export async function startRelay(options?: CollabRelayOptions): Promise<CollabRelay> {
  const relay = new CollabRelay(options);
  await relay.start();
  return relay;
}