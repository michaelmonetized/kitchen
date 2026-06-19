import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import watcher from "@parcel/watcher";
import type { ConvexClient } from "convex/browser";
import { api } from "./convex-api.js";
import type { Id } from "./types.js";
import { EchoSuppressor } from "./echo-suppressor.js";
import { normalizeAbsolutePath } from "./normalize-path.js";
import {
  buildRelativePath,
  parseMirrorPath,
  resolveParentId,
  type ProjectInfo,
  type TreeNode,
} from "./paths.js";

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
    await this.uploadIfChanged(absolutePath);
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