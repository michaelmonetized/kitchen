import { mkdir, rename, unlink } from "node:fs/promises";
import path from "node:path";
import type { ConvexClient } from "convex/browser";
import { api } from "./convex-api.js";
import { createHash } from "node:crypto";
import { atomicWrite } from "./atomic-write.js";
import { EchoSuppressor } from "./echo-suppressor.js";
import {
  buildRelativePath,
  mirrorPath,
  projectSlug,
  type ProjectInfo,
  type TreeNode,
} from "./paths.js";
import type { Id } from "./types.js";

type Unsubscribe = () => void;

type FileRow = {
  _id: Id<"files">;
  parentId?: Id<"files">;
  name: string;
  type: "dir" | "file";
  forked: boolean;
};

export type CloudToDiskOptions = {
  client: ConvexClient;
  mirrorRoot: string;
  echo: EchoSuppressor;
  onPathMapped?: (absolutePath: string, fileId: Id<"files">) => void;
  onPathRemapped?: (
    oldPath: string,
    newPath: string,
    fileId: Id<"files">,
  ) => void;
  onProjectDir?: (absoluteDir: string) => void;
  onVersionSynced?: (fileId: Id<"files">, versionId: Id<"versions">) => void;
  onContentHash?: (fileId: Id<"files">, hash: string) => void;
};

export class CloudToDiskEngine {
  private readonly client: ConvexClient;
  private readonly mirrorRoot: string;
  private readonly echo: EchoSuppressor;
  private readonly onPathMapped?: (absolutePath: string, fileId: Id<"files">) => void;
  private readonly onPathRemapped?: (
    oldPath: string,
    newPath: string,
    fileId: Id<"files">,
  ) => void;
  private readonly onProjectDir?: (absoluteDir: string) => void;
  private readonly onVersionSynced?: (
    fileId: Id<"files">,
    versionId: Id<"versions">,
  ) => void;
  private readonly onContentHash?: (fileId: Id<"files">, hash: string) => void;

  private readonly projects = new Map<Id<"files">, ProjectInfo>();
  private readonly slugToProject = new Map<string, ProjectInfo>();
  private readonly nodes = new Map<Id<"files">, TreeNode>();
  private readonly childUnsubs = new Map<Id<"files">, Unsubscribe>();
  private readonly fileSubscriptions = new Map<Id<"files">, Unsubscribe>();
  private readonly writtenVersion = new Map<Id<"files">, string>();
  private readonly fileIdToPath = new Map<Id<"files">, string>();
  private projectsUnsub: Unsubscribe | null = null;

  constructor(options: CloudToDiskOptions) {
    this.client = options.client;
    this.mirrorRoot = options.mirrorRoot;
    this.echo = options.echo;
    this.onPathMapped = options.onPathMapped;
    this.onPathRemapped = options.onPathRemapped;
    this.onProjectDir = options.onProjectDir;
    this.onVersionSynced = options.onVersionSynced;
    this.onContentHash = options.onContentHash;
  }

  get slugIndex(): Map<string, ProjectInfo> {
    return this.slugToProject;
  }

  get treeNodes(): TreeNode[] {
    return [...this.nodes.values()];
  }

  start(): void {
    this.projectsUnsub = this.client.onUpdate(
      api.queries.projectsForUser,
      {},
      (rows) => {
        void this.syncProjects(rows ?? []);
      },
    );
  }

  stop(): void {
    this.projectsUnsub?.();
    this.projectsUnsub = null;
    for (const unsub of this.childUnsubs.values()) unsub();
    this.childUnsubs.clear();
    for (const unsub of this.fileSubscriptions.values()) unsub();
    this.fileSubscriptions.clear();
    this.nodes.clear();
  }

  private async syncProjects(
    rows: { org: { name: string }; project: { _id: Id<"files">; name: string } }[],
  ): Promise<void> {
    const seen = new Set<Id<"files">>();

    for (const row of rows) {
      const projectId = row.project._id;
      seen.add(projectId);
      const slug = projectSlug(row.project.name, row.org.name);
      const info: ProjectInfo = {
        projectId,
        slug,
        name: row.project.name,
      };

      this.projects.set(projectId, info);
      this.slugToProject.set(slug, info);
      const projectDir = path.join(this.mirrorRoot, slug);
      await mkdir(projectDir, { recursive: true });
      this.onProjectDir?.(projectDir);
      this.ensureChildrenSubscription(projectId, projectId);
    }

    for (const [parentId, unsub] of this.childUnsubs) {
      const projectId = this.nodes.get(parentId)?.parentId
        ? this.projectIdFor(parentId)
        : parentId;
      if (projectId && !seen.has(projectId)) {
        unsub();
        this.childUnsubs.delete(parentId);
      }
    }
  }

  private projectIdFor(nodeId: Id<"files">): Id<"files"> | null {
    let current = this.nodes.get(nodeId);
    while (current) {
      if (this.projects.has(current._id)) return current._id;
      current = current.parentId ? this.nodes.get(current.parentId) : undefined;
    }
    return null;
  }

  private ensureChildrenSubscription(
    parentId: Id<"files">,
    projectId: Id<"files">,
  ): void {
    if (this.childUnsubs.has(parentId)) return;

    const unsub = this.client.onUpdate(
      api.queries.children,
      { parentId },
      (rows) => {
        void this.onChildren(parentId, projectId, (rows ?? []) as FileRow[]);
      },
    );
    this.childUnsubs.set(parentId, unsub);
  }

  private async onChildren(
    parentId: Id<"files">,
    projectId: Id<"files">,
    rows: FileRow[],
  ): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) return;

    const seen = new Set<Id<"files">>();
    for (const row of rows) {
      seen.add(row._id);
      const node: TreeNode = {
        _id: row._id,
        parentId,
        name: row.name,
        type: row.type,
        forked: row.forked,
      };
      this.nodes.set(row._id, node);

      const allNodes = [...this.nodes.values()];
      const relative = buildRelativePath(allNodes, row._id, projectId);
      if (!relative) continue;

      const absolute = mirrorPath(this.mirrorRoot, project.slug, relative);
      if (row.type === "dir") {
        await mkdir(absolute, { recursive: true });
        this.ensureChildrenSubscription(row._id, projectId);
        continue;
      }

      const previousPath = this.fileIdToPath.get(row._id);
      if (previousPath && previousPath !== absolute) {
        await this.relocateOnDisk(row._id, previousPath, absolute);
      } else {
        this.onPathMapped?.(absolute, row._id);
        this.ensureFileSubscription(row._id, absolute);
      }
      this.fileIdToPath.set(row._id, absolute);
    }

    for (const [nodeId] of this.nodes) {
      const node = this.nodes.get(nodeId);
      if (!node || node.parentId !== parentId) continue;
      if (!seen.has(nodeId)) {
        const removed = this.nodes.get(nodeId);
        this.nodes.delete(nodeId);
        const fileUnsub = this.fileSubscriptions.get(nodeId);
        if (fileUnsub) {
          fileUnsub();
          this.fileSubscriptions.delete(nodeId);
        }
        this.writtenVersion.delete(nodeId);
        const childUnsub = this.childUnsubs.get(nodeId);
        if (childUnsub) {
          childUnsub();
          this.childUnsubs.delete(nodeId);
        }
        const diskPath = this.fileIdToPath.get(nodeId);
        if (diskPath && removed?.type === "file") {
          this.fileIdToPath.delete(nodeId);
          this.echo.mark(diskPath);
          void unlink(diskPath).catch(() => {});
          console.log(`cloud→disk remove ${diskPath}`);
        }
      }
    }
  }

  private async relocateOnDisk(
    fileId: Id<"files">,
    fromPath: string,
    toPath: string,
  ): Promise<void> {
    await mkdir(path.dirname(toPath), { recursive: true });
    this.echo.mark(fromPath);
    this.echo.mark(toPath);
    try {
      await rename(fromPath, toPath);
    } catch {
      // Source may not exist yet if cloud metadata arrived before first write.
    }
    this.onPathRemapped?.(fromPath, toPath, fileId);
    const unsub = this.fileSubscriptions.get(fileId);
    if (unsub) {
      unsub();
      this.fileSubscriptions.delete(fileId);
    }
    this.writtenVersion.delete(fileId);
    this.ensureFileSubscription(fileId, toPath);
    console.log(`cloud→disk rename ${fromPath} → ${toPath}`);
  }

  private ensureFileSubscription(fileId: Id<"files">, absolutePath: string): void {
    if (this.fileSubscriptions.has(fileId)) return;

    const unsub = this.client.onUpdate(
      api.queries.getFileWithContent,
      { fileId },
      (payload) => {
        void this.writeFileContent(fileId, absolutePath, payload);
      },
    );
    this.fileSubscriptions.set(fileId, unsub);
  }

  private async writeFileContent(
    fileId: Id<"files">,
    absolutePath: string,
    payload: {
      file: { currentVersionId?: Id<"versions"> };
      content: string | null;
      version: { _id: Id<"versions"> } | null;
    } | null,
  ): Promise<void> {
    if (!payload?.version || payload.content === null) return;

    const versionId = payload.version._id;
    if (this.writtenVersion.get(fileId) === versionId) return;

    const bytes = Buffer.from(payload.content, "utf8");
    this.echo.mark(absolutePath);
    this.onPathMapped?.(absolutePath, fileId);
    try {
      await atomicWrite(absolutePath, bytes);
    } catch (err) {
      console.error(`cloud→disk write failed ${absolutePath}:`, err);
      return;
    }
    this.writtenVersion.set(fileId, versionId);
    this.onContentHash?.(fileId, sha256(bytes));
    this.onVersionSynced?.(fileId, versionId);
    console.log(`cloud→disk ${absolutePath} (v ${versionId})`);
  }
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}