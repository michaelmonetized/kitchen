import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import watcher from "@parcel/watcher";
import type { ConvexClient } from "convex/browser";
import { api } from "./convex-api.js";
import type { Id } from "./types.js";
import { EchoSuppressor } from "./echo-suppressor.js";
import { parseMirrorPath, type ProjectInfo } from "./paths.js";

const DEBOUNCE_MS = 300;

export type DiskToCloudOptions = {
  client: ConvexClient;
  mirrorRoot: string;
  echo: EchoSuppressor;
  getSlugIndex: () => Map<string, ProjectInfo>;
  getPathToFileId: () => Map<string, Id<"files">>;
  getCurrentVersionId?: (fileId: Id<"files">) => Id<"versions"> | undefined;
  onVersionInserted?: (fileId: Id<"files">, versionId: Id<"versions">) => void;
  onCloudHash?: (fileId: Id<"files">, hash: string) => void;
};

export class DiskToCloudEngine {
  private readonly client: ConvexClient;
  private readonly mirrorRoot: string;
  private readonly echo: EchoSuppressor;
  private readonly getSlugIndex: () => Map<string, ProjectInfo>;
  private readonly getPathToFileId: () => Map<string, Id<"files">>;
  private readonly getCurrentVersionId?: (
    fileId: Id<"files">,
  ) => Id<"versions"> | undefined;
  private readonly onVersionInserted?: (
    fileId: Id<"files">,
    versionId: Id<"versions">,
  ) => void;
  private readonly onCloudHash?: (fileId: Id<"files">, hash: string) => void;

  private readonly subscriptions = new Map<
    string,
    Awaited<ReturnType<typeof watcher.subscribe>>
  >();
  private readonly debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly localHash = new Map<Id<"files">, string>();
  private readonly inflight = new Set<Id<"files">>();

  constructor(options: DiskToCloudOptions) {
    this.client = options.client;
    this.mirrorRoot = options.mirrorRoot;
    this.echo = options.echo;
    this.getSlugIndex = options.getSlugIndex;
    this.getPathToFileId = options.getPathToFileId;
    this.getCurrentVersionId = options.getCurrentVersionId;
    this.onVersionInserted = options.onVersionInserted;
    this.onCloudHash = options.onCloudHash;
  }

  async start(): Promise<void> {
    await this.watchDirectory(this.mirrorRoot);
  }

  async watchDirectory(dir: string): Promise<void> {
    const resolved = path.resolve(dir);
    if (this.subscriptions.has(resolved)) return;

    const sub = await watcher.subscribe(
      resolved,
      (err, events) => {
        if (err) {
          console.error(`watcher error (${resolved}):`, err);
          return;
        }
        for (const event of events) {
          if (event.type === "delete") continue;
          this.scheduleUpload(event.path);
        }
      },
      { ignore: ["**/.git/**", "**/node_modules/**", "**/*.tmp"] },
    );
    this.subscriptions.set(resolved, sub);
    console.log(`watching ${resolved}`);
  }

  async stop(): Promise<void> {
    for (const timer of this.debounceTimers.values()) clearTimeout(timer);
    this.debounceTimers.clear();
    for (const sub of this.subscriptions.values()) await sub.unsubscribe();
    this.subscriptions.clear();
  }

  private scheduleUpload(absolutePath: string): void {
    if (this.echo.isSuppressed(absolutePath)) return;

    const existing = this.debounceTimers.get(absolutePath);
    if (existing) clearTimeout(existing);

    this.debounceTimers.set(
      absolutePath,
      setTimeout(() => {
        this.debounceTimers.delete(absolutePath);
        void this.uploadIfChanged(absolutePath);
      }, DEBOUNCE_MS),
    );
  }

  private async uploadIfChanged(absolutePath: string): Promise<void> {
    if (this.echo.isSuppressed(absolutePath)) return;

    const parsed = parseMirrorPath(
      this.mirrorRoot,
      absolutePath,
      this.getSlugIndex(),
    );
    if (!parsed) return;

    const fileId = this.getPathToFileId().get(path.resolve(absolutePath));
    if (!fileId) return;

    if (this.inflight.has(fileId)) return;

    let bytes: Buffer;
    try {
      bytes = await readFile(absolutePath);
    } catch {
      return;
    }

    const hash = sha256(bytes);
    if (this.localHash.get(fileId) === hash) return;

    this.inflight.add(fileId);
    try {
      const content = Uint8Array.from(bytes).buffer;
      let parentVersionId = this.getCurrentVersionId?.(fileId);
      if (!parentVersionId) {
        const file = await this.client.query(api.queries.getFile, { fileId });
        parentVersionId = file?.currentVersionId;
      }
      const result = await this.client.mutation(api.versions.insert, {
        fileId,
        content,
        ...(parentVersionId
          ? { parentVersionIds: [parentVersionId] }
          : {}),
      });

      this.localHash.set(fileId, hash);
      if (!result?.forked) {
        const file = await this.client.query(api.queries.getFile, { fileId });
        if (file?.currentVersionId) {
          this.onVersionInserted?.(fileId, file.currentVersionId);
        }
      }
      this.onCloudHash?.(fileId, hash);

      if (result?.forked) {
        console.warn(`fork detected for ${absolutePath} — open Kitchen merge UI`);
      } else {
        console.log(`disk→cloud ${absolutePath}`);
      }
    } catch (err) {
      console.error(`disk→cloud failed ${absolutePath}:`, err);
    } finally {
      this.inflight.delete(fileId);
    }
  }
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}