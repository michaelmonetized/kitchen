import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import watcher from "@parcel/watcher";
import type { ConvexClient } from "convex/browser";
import { api } from "./convex-api.js";
import type { Id } from "./types.js";
import { EchoSuppressor } from "./echo-suppressor.js";
import { normalizeAbsolutePath } from "./normalize-path.js";
import type { InsertQueue } from "./insert-queue.js";
import { notifyFork } from "./notify.js";
import {
  buildRelativePath,
  parseMirrorPath,
  resolveParentId,
  type ProjectInfo,
  type TreeNode,
} from "./paths.js";
import { isOfflineError } from "./queue-flush.js";

const DEBOUNCE_MS = 300;
const RENAME_WINDOW_MS = 1000;

export type DiskToCloudOptions = {
  client: ConvexClient;
  mirrorRoot: string;
  echo: EchoSuppressor;
  getSlugIndex: () => Map<string, ProjectInfo>;
  getPathToFileId: () => Map<string, Id<"files">>;
  getTreeNodes?: () => TreeNode[];
  onPathRemapped?: (
    oldPath: string,
    newPath: string,
    fileId: Id<"files">,
  ) => void;
  getCurrentVersionId?: (fileId: Id<"files">) => Id<"versions"> | undefined;
  onVersionInserted?: (fileId: Id<"files">, versionId: Id<"versions">) => void;
  onCloudHash?: (fileId: Id<"files">, hash: string) => void;
  queue?: InsertQueue;
  getIsOnline?: () => boolean;
  onQueued?: (queuedCount: number) => void;
};

export class DiskToCloudEngine {
  private readonly client: ConvexClient;
  private readonly mirrorRoot: string;
  private readonly echo: EchoSuppressor;
  private readonly getSlugIndex: () => Map<string, ProjectInfo>;
  private readonly getPathToFileId: () => Map<string, Id<"files">>;
  private readonly getTreeNodes?: () => TreeNode[];
  private readonly onPathRemapped?: (
    oldPath: string,
    newPath: string,
    fileId: Id<"files">,
  ) => void;
  private readonly getCurrentVersionId?: (
    fileId: Id<"files">,
  ) => Id<"versions"> | undefined;
  private readonly onVersionInserted?: (
    fileId: Id<"files">,
    versionId: Id<"versions">,
  ) => void;
  private readonly onCloudHash?: (fileId: Id<"files">, hash: string) => void;
  private readonly queue?: InsertQueue;
  private readonly getIsOnline?: () => boolean;
  private readonly onQueued?: (queuedCount: number) => void;

  private readonly subscriptions = new Map<
    string,
    Awaited<ReturnType<typeof watcher.subscribe>>
  >();
  private readonly debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly localHash = new Map<Id<"files">, string>();
  private readonly inflight = new Set<Id<"files">>();
  private readonly pendingRenames = new Map<
    Id<"files">,
    { oldPath: string; at: number }
  >();
  private readonly pendingDeleteTimers = new Map<
    Id<"files">,
    ReturnType<typeof setTimeout>
  >();

  constructor(options: DiskToCloudOptions) {
    this.client = options.client;
    this.mirrorRoot = options.mirrorRoot;
    this.echo = options.echo;
    this.getSlugIndex = options.getSlugIndex;
    this.getPathToFileId = options.getPathToFileId;
    this.getTreeNodes = options.getTreeNodes;
    this.onPathRemapped = options.onPathRemapped;
    this.getCurrentVersionId = options.getCurrentVersionId;
    this.onVersionInserted = options.onVersionInserted;
    this.onCloudHash = options.onCloudHash;
    this.queue = options.queue;
    this.getIsOnline = options.getIsOnline;
    this.onQueued = options.onQueued;
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
          if (event.type === "delete") {
            this.handleDelete(event.path);
            continue;
          }
          this.scheduleUpload(event.path);
        }
      },
      { ignore: ["**/.git/**", "**/node_modules/**", "**/*.tmp"] },
    );
    this.subscriptions.set(resolved, sub);
    console.log(`watching ${resolved}`);
  }

  noteCloudHash(fileId: Id<"files">, hash: string): void {
    this.localHash.set(fileId, hash);
  }

  async stop(): Promise<void> {
    for (const timer of this.debounceTimers.values()) clearTimeout(timer);
    this.debounceTimers.clear();
    for (const timer of this.pendingDeleteTimers.values()) clearTimeout(timer);
    this.pendingDeleteTimers.clear();
    for (const sub of this.subscriptions.values()) await sub.unsubscribe();
    this.subscriptions.clear();
  }

  private scheduleUpload(absolutePath: string): void {
    console.log(`watcher schedule: ${absolutePath}`);
    if (this.echo.isSuppressed(absolutePath)) return;

    const existing = this.debounceTimers.get(absolutePath);
    if (existing) clearTimeout(existing);

    this.debounceTimers.set(
      absolutePath,
      setTimeout(() => {
        this.debounceTimers.delete(absolutePath);
        void this.handlePathChange(absolutePath);
      }, DEBOUNCE_MS),
    );
  }

  private handleDelete(absolutePath: string): void {
    const resolved = normalizeAbsolutePath(absolutePath);
    const fileId = this.getPathToFileId().get(resolved);
    if (!fileId) return;

    this.pendingRenames.set(fileId, { oldPath: resolved, at: Date.now() });

    const existing = this.pendingDeleteTimers.get(fileId);
    if (existing) clearTimeout(existing);

    this.pendingDeleteTimers.set(
      fileId,
      setTimeout(() => {
        this.pendingDeleteTimers.delete(fileId);
        if (!this.pendingRenames.has(fileId)) return;
        this.pendingRenames.delete(fileId);
        void this.tombstone(fileId, resolved);
      }, RENAME_WINDOW_MS),
    );
  }

  private async tombstone(
    fileId: Id<"files">,
    absolutePath: string,
  ): Promise<void> {
    try {
      await this.client.mutation(api.files.markDeleted, { fileId });
      this.getPathToFileId().delete(normalizeAbsolutePath(absolutePath));
      console.log(`disk→cloud tombstone ${absolutePath}`);
    } catch (err) {
      console.error(`disk→cloud tombstone failed ${absolutePath}:`, err);
    }
  }

  private async handlePathChange(absolutePath: string): Promise<void> {
    if (this.echo.isSuppressed(absolutePath)) {
      console.warn(`disk→cloud echo-suppressed: ${absolutePath}`);
      return;
    }
    if (await this.tryHandleRename(absolutePath)) return;
    if (await this.tryEnsureDirInCloud(absolutePath)) return;
    await this.uploadIfChanged(absolutePath);
  }

  private async tryEnsureDirInCloud(absolutePath: string): Promise<boolean> {
    const resolved = normalizeAbsolutePath(absolutePath);
    let info;
    try {
      info = await stat(resolved);
    } catch {
      return false;
    }
    if (!info.isDirectory()) return false;

    const parsed = parseMirrorPath(
      this.mirrorRoot,
      resolved,
      this.getSlugIndex(),
    );
    if (!parsed) return false;

    const segments = parsed.relativePath.split(path.sep);
    const name = segments.pop();
    if (!name) return false;
    const relativeDir = segments.join(path.sep);

    const nodes = this.getTreeNodes?.() ?? [];
    const parentId =
      resolveParentId(nodes, parsed.project.projectId, relativeDir) ??
      parsed.project.projectId;

    const exists = nodes.some(
      (n) =>
        n.parentId === parentId && n.name === name && n.type === "dir",
    );
    if (exists) return true;

    try {
      await this.client.mutation(api.files.insert, {
        parentId,
        type: "dir",
        name,
      });
      console.log(`disk→cloud mkdir ${resolved}`);
      return true;
    } catch (err) {
      console.error(`disk→cloud mkdir failed ${resolved}:`, err);
      return false;
    }
  }

  private async tryHandleRename(absolutePath: string): Promise<boolean> {
    const resolved = normalizeAbsolutePath(absolutePath);
    try {
      const info = await stat(resolved);
      if (!info.isFile()) return false;
    } catch {
      return false;
    }

    const parsed = parseMirrorPath(
      this.mirrorRoot,
      resolved,
      this.getSlugIndex(),
    );
    if (!parsed) return false;

    const segments = parsed.relativePath.split(path.sep);
    const name = segments.pop();
    if (!name) return false;
    const relativeDir = segments.join(path.sep);

    const now = Date.now();
    for (const [fileId, pending] of this.pendingRenames) {
      if (now - pending.at > 5000) {
        this.pendingRenames.delete(fileId);
        continue;
      }

      const oldParsed = parseMirrorPath(
        this.mirrorRoot,
        pending.oldPath,
        this.getSlugIndex(),
      );
      if (
        !oldParsed ||
        oldParsed.project.projectId !== parsed.project.projectId
      ) {
        continue;
      }

      const nodes = this.getTreeNodes?.() ?? [];
      const parentId =
        resolveParentId(nodes, parsed.project.projectId, relativeDir) ??
        parsed.project.projectId;

      try {
        await this.client.mutation(api.files.updateMetadata, {
          fileId,
          name,
          parentId,
        });
        this.pendingRenames.delete(fileId);
        const deleteTimer = this.pendingDeleteTimers.get(fileId);
        if (deleteTimer) {
          clearTimeout(deleteTimer);
          this.pendingDeleteTimers.delete(fileId);
        }
        this.onPathRemapped?.(pending.oldPath, resolved, fileId);
        console.log(`disk→cloud rename ${pending.oldPath} → ${resolved}`);
        return true;
      } catch (err) {
        console.error(`disk→cloud rename failed ${resolved}:`, err);
        return false;
      }
    }

    return false;
  }

  private resolveFileId(absolutePath: string): Id<"files"> | null {
    const resolved = normalizeAbsolutePath(absolutePath);
    const fromMap = this.getPathToFileId().get(resolved);
    if (fromMap) return fromMap;

    const parsed = parseMirrorPath(
      this.mirrorRoot,
      resolved,
      this.getSlugIndex(),
    );
    if (!parsed) return null;

    const nodes = this.getTreeNodes?.() ?? [];
    for (const node of nodes) {
      if (node.type !== "file") continue;
      const rel = buildRelativePath(
        nodes,
        node._id,
        parsed.project.projectId,
      );
      if (rel === parsed.relativePath) {
        if (this.onPathRemapped) {
          this.onPathRemapped(resolved, resolved, node._id);
        }
        return node._id;
      }
    }
    return null;
  }

  private async uploadIfChanged(absolutePath: string): Promise<void> {
    if (this.echo.isSuppressed(absolutePath)) return;

    const parsed = parseMirrorPath(
      this.mirrorRoot,
      absolutePath,
      this.getSlugIndex(),
    );
    if (!parsed) return;

    const fileId = this.resolveFileId(absolutePath);
    if (!fileId) {
      console.warn(`disk→cloud skip (unmapped path): ${absolutePath}`);
      return;
    }

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
      if (!parentVersionId && this.getIsOnline?.()) {
        const file = await this.client.query(api.queries.getFile, { fileId });
        parentVersionId = file?.currentVersionId;
      }

      if (!this.getIsOnline?.()) {
        await this.enqueueOffline({
          absolutePath,
          fileId,
          hash,
          bytes,
          parentVersionId,
          projectId: parsed.project.projectId,
          fileName: path.basename(absolutePath),
        });
        return;
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
        const fileName = path.basename(absolutePath);
        void notifyFork({
          fileId,
          projectId: parsed.project.projectId,
          fileName,
        });
        console.warn(`fork detected for ${absolutePath} — open Kitchen merge UI`);
      } else {
        console.log(`disk→cloud ${absolutePath}`);
      }
    } catch (err) {
      if (this.queue && isOfflineError(err)) {
        const bytes = await readFile(absolutePath).catch(() => null);
        if (bytes) {
          const hash = sha256(bytes);
          let parentVersionId = this.getCurrentVersionId?.(fileId);
          await this.enqueueOffline({
            absolutePath,
            fileId,
            hash,
            bytes,
            parentVersionId,
            projectId: parsed.project.projectId,
            fileName: path.basename(absolutePath),
          });
          return;
        }
      }
      console.error(`disk→cloud failed ${absolutePath}:`, err);
    } finally {
      this.inflight.delete(fileId);
    }
  }

  private async enqueueOffline(options: {
    absolutePath: string;
    fileId: Id<"files">;
    hash: string;
    bytes: Buffer;
    parentVersionId?: Id<"versions">;
    projectId: Id<"files">;
    fileName: string;
  }): Promise<void> {
    if (!this.queue) {
      console.error(`disk→cloud offline but no queue: ${options.absolutePath}`);
      return;
    }
    await this.queue.enqueue({
      absolutePath: options.absolutePath,
      fileId: options.fileId,
      hash: options.hash,
      contentBase64: options.bytes.toString("base64"),
      parentVersionId: options.parentVersionId,
      projectId: options.projectId,
      fileName: options.fileName,
    });
    this.localHash.set(options.fileId, options.hash);
    const queued = await this.queue.count();
    this.onQueued?.(queued);
    console.log(`disk→cloud queued (offline) ${options.absolutePath}`);
  }
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}