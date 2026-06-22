import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { isLegacyOrgFile } from "./lib/account";
import { canRead, canWrite } from "./lib/authz";
import { computeBlame } from "./lib/blame";
import { isDeleted } from "./lib/deleted";
import { requireUser } from "./lib/session";
import { getVersionHeads } from "./lib/versionHeads";

function decodeVersionContent(content: ArrayBuffer) {
  return new TextDecoder().decode(new Uint8Array(content));
}

async function authorLabel(
  ctx: QueryCtx,
  authorUserId: Id<"users">,
) {
  const author = await ctx.db.get(authorUserId);
  return author?.displayName ?? author?.email ?? String(authorUserId);
}

export const projectsForUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const projects: {
      org: { _id: Id<"files">; name: string } | null;
      account: { _id: Id<"files">; name: string } | null;
      project: Doc<"files">;
      mirrorName: string;
    }[] = [];

    if (user.accountFileId) {
      const account = await ctx.db.get(user.accountFileId);
      if (account) {
        const children = await ctx.db
          .query("files")
          .withIndex("by_parent", (q) => q.eq("parentId", account._id))
          .collect();
        for (const child of children) {
          if (child.type !== "dir" || isDeleted(child.properties)) continue;
          if (!(await canRead(ctx, user._id, child._id))) continue;
          projects.push({
            org: null,
            account: { _id: account._id, name: account.name },
            project: child,
            mirrorName: child.name,
          });
        }
      }
    }

    const assignments = await ctx.db
      .query("user_roles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const orgIds = new Set<Id<"files">>();
    for (const assignment of assignments) {
      const role = await ctx.db.get(assignment.roleId);
      if (role) orgIds.add(role.orgFileId);
    }

    for (const orgId of orgIds) {
      const org = await ctx.db.get(orgId);
      if (!org || !isLegacyOrgFile(org)) continue;

      const children = await ctx.db
        .query("files")
        .withIndex("by_parent", (q) => q.eq("parentId", org._id))
        .collect();
      for (const child of children) {
        if (child.type !== "dir" || isDeleted(child.properties)) continue;
        if (!(await canRead(ctx, user._id, child._id))) continue;
        if (projects.some((p) => p.project._id === child._id)) continue;
        projects.push({
          org: { _id: org._id, name: org.name },
          account: null,
          project: child,
          mirrorName: child.name,
        });
      }
    }

    return projects.sort((a, b) => a.mirrorName.localeCompare(b.mirrorName));
  },
});

export const children = query({
  args: { parentId: v.id("files") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!(await canRead(ctx, user._id, args.parentId))) return [];

    const rows = await ctx.db
      .query("files")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();

    const visible = [];
    for (const row of rows) {
      if (isDeleted(row.properties)) continue;
      if (await canRead(ctx, user._id, row._id)) visible.push(row);
    }
    return visible;
  },
});

export const listProjectTree = query({
  args: { projectId: v.id("files") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!(await canRead(ctx, user._id, args.projectId))) return [];

    const project = await ctx.db.get(args.projectId);
    if (!project || project.type !== "dir") return [];

    const nodes: {
      _id: Id<"files">;
      parentId: Id<"files">;
      name: string;
      type: "dir" | "file";
      forked: boolean;
    }[] = [];

    async function walk(parentId: Id<"files">) {
      const rows = await ctx.db
        .query("files")
        .withIndex("by_parent", (q) => q.eq("parentId", parentId))
        .collect();

      for (const row of rows) {
        if (isDeleted(row.properties)) continue;
        if (!(await canRead(ctx, user._id, row._id))) continue;
        nodes.push({
          _id: row._id,
          parentId,
          name: row.name,
          type: row.type,
          forked: row.forked,
        });
        if (row.type === "dir") await walk(row._id);
      }
    }

    await walk(args.projectId);
    return nodes;
  },
});

export const getFile = query({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const file = await ctx.db.get(args.fileId);
    if (!file) return null;
    if (!(await canRead(ctx, user._id, file._id))) return null;
    return file;
  },
});

export const getFileWithContent = query({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const file = await ctx.db.get(args.fileId);
    if (!file || file.type !== "file") return null;
    if (!(await canRead(ctx, user._id, file._id))) return null;

    if (!file.currentVersionId) {
      return { file, content: null, version: null };
    }

    const version = await ctx.db.get(file.currentVersionId);
    if (!version) return { file, content: null, version: null };

    const bytes = new Uint8Array(version.content);
    const content = new TextDecoder().decode(bytes);
    return { file, content, version };
  },
});

/** Mirror client sync payload — fork policy A: author's head only when forked. */
export const mirrorFileSync = query({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const file = await ctx.db.get(args.fileId);
    if (!file || file.type !== "file") return null;
    if (!(await canRead(ctx, user._id, file._id))) return null;

    const decode = (content: ArrayBuffer) =>
      new TextDecoder().decode(new Uint8Array(content));

    if (!file.forked) {
      if (!file.currentVersionId) {
        return { file, content: null, version: null };
      }
      const version = await ctx.db.get(file.currentVersionId);
      if (!version) return { file, content: null, version: null };
      return { file, content: decode(version.content), version };
    }

    const heads = await getVersionHeads(ctx, args.fileId);
    const userHead = heads
      .filter((head) => head.authorUserId === user._id)
      .sort((a, b) => b._creationTime - a._creationTime)[0];

    if (!userHead) {
      return { file, content: null, version: null };
    }

    return {
      file,
      content: decode(userHead.content),
      version: userHead,
    };
  },
});

export const getForkMergeContext = query({
  args: {
    fileId: v.id("files"),
    leftVersionId: v.optional(v.id("versions")),
    rightVersionId: v.optional(v.id("versions")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const file = await ctx.db.get(args.fileId);
    if (!file || file.type !== "file") return null;
    if (!(await canRead(ctx, user._id, file._id))) return null;

    const heads = await getVersionHeads(ctx, args.fileId);
    const decode = (content: ArrayBuffer) =>
      new TextDecoder().decode(new Uint8Array(content));

    const headPayload = heads
      .map((head) => ({
        _id: head._id,
        _creationTime: head._creationTime,
        content: decode(head.content),
      }))
      .sort((a, b) => a._creationTime - b._creationTime);

    let left = headPayload[0] ?? null;
    let right = headPayload[1] ?? null;

    if (args.leftVersionId && args.rightVersionId) {
      left =
        headPayload.find((h) => h._id === args.leftVersionId) ?? left;
      right =
        headPayload.find((h) => h._id === args.rightVersionId) ?? right;
    }

    return { file, heads: headPayload, left, right };
  },
});

export const listVersions = query({
  args: {
    fileId: v.id("files"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const file = await ctx.db.get(args.fileId);
    if (!file || !(await canRead(ctx, user._id, args.fileId))) return [];

    const all = await ctx.db
      .query("versions")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .order("desc")
      .collect();

    const offset = args.cursor ?? 0;
    const limit = args.limit ?? 50;
    const slice = all.slice(offset, offset + limit);

    return Promise.all(
      slice.map(async (ver) => ({
        _id: ver._id,
        _creationTime: ver._creationTime,
        authorUserId: ver.authorUserId,
        authorLabel: await authorLabel(ctx, ver.authorUserId),
        parentVersionIds: ver.parentVersionIds,
        isCurrent: ver._id === file.currentVersionId,
      })),
    );
  },
});

export const getFileCompareContext = query({
  args: {
    fileId: v.id("files"),
    leftVersionId: v.optional(v.id("versions")),
    rightVersionId: v.optional(v.id("versions")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const file = await ctx.db.get(args.fileId);
    if (!file || file.type !== "file") return null;
    if (!(await canRead(ctx, user._id, file._id))) return null;

    const rows = await ctx.db
      .query("versions")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .collect();

    const versionPayload = await Promise.all(
      rows.map(async (ver) => ({
        _id: ver._id,
        _creationTime: ver._creationTime,
        authorUserId: ver.authorUserId,
        authorLabel: await authorLabel(ctx, ver.authorUserId),
        content: decodeVersionContent(ver.content),
        isCurrent: ver._id === file.currentVersionId,
      })),
    );

    const sorted = [...versionPayload].sort(
      (a, b) => a._creationTime - b._creationTime,
    );

    let left = sorted[sorted.length - 2] ?? sorted[0] ?? null;
    let right = sorted[sorted.length - 1] ?? null;

    if (args.leftVersionId) {
      left = sorted.find((v) => v._id === args.leftVersionId) ?? left;
    }
    if (args.rightVersionId) {
      right = sorted.find((v) => v._id === args.rightVersionId) ?? right;
    }

    return {
      file,
      versions: sorted,
      left,
      right,
      canWrite: await canWrite(ctx, user._id, file._id),
    };
  },
});

export const getFileBlame = query({
  args: {
    fileId: v.id("files"),
    versionId: v.optional(v.id("versions")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const file = await ctx.db.get(args.fileId);
    if (!file || file.type !== "file") return null;
    if (!(await canRead(ctx, user._id, file._id))) return null;

    const rows = await ctx.db
      .query("versions")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .collect();

    const targetId = args.versionId ?? file.currentVersionId;
    const writable = await canWrite(ctx, user._id, file._id);
    if (!targetId) {
      return { file, lines: [] as ReturnType<typeof computeBlame>, canWrite: writable };
    }

    const target = rows.find((row) => row._id === targetId);
    if (!target) {
      return { file, lines: [] as ReturnType<typeof computeBlame>, canWrite: writable };
    }

    const chronology = rows
      .filter((row) => row._creationTime <= target._creationTime)
      .sort((a, b) => a._creationTime - b._creationTime);

    const snapshots = await Promise.all(
      chronology.map(async (ver) => ({
        _id: String(ver._id),
        _creationTime: ver._creationTime,
        authorUserId: String(ver.authorUserId),
        authorLabel: await authorLabel(ctx, ver.authorUserId),
        content: decodeVersionContent(ver.content),
      })),
    );

    return { file, lines: computeBlame(snapshots), canWrite: writable };
  },
});