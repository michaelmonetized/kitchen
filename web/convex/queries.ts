import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { canRead } from "./lib/authz";
import { requireUser } from "./lib/session";

export const projectsForUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const assignments = await ctx.db
      .query("user_roles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const orgIds = new Set<Id<"files">>();
    for (const assignment of assignments) {
      const role = await ctx.db.get(assignment.roleId);
      if (role) orgIds.add(role.orgFileId);
    }

    const projects = [];
    for (const orgId of orgIds) {
      const org = await ctx.db.get(orgId);
      if (!org) continue;

      const children = await ctx.db
        .query("files")
        .withIndex("by_parent", (q) => q.eq("parentId", org._id))
        .collect();
      for (const child of children) {
        if (child.type === "dir" && (await canRead(ctx, user._id, child._id))) {
          projects.push({ org, project: child });
        }
      }
    }
    return projects;
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
      if (await canRead(ctx, user._id, row._id)) visible.push(row);
    }
    return visible;
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

    const versions = await ctx.db
      .query("versions")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .collect();

    const referenced = new Set<string>();
    for (const ver of versions) {
      for (const parent of ver.parentVersionIds ?? []) {
        referenced.add(parent);
      }
    }

    const heads = versions.filter((ver) => !referenced.has(ver._id));
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
  args: { fileId: v.id("files"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!(await canRead(ctx, user._id, args.fileId))) return [];

    const versions = await ctx.db
      .query("versions")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .order("desc")
      .take(args.limit ?? 50);

    return versions.map((ver) => ({
      _id: ver._id,
      _creationTime: ver._creationTime,
      authorUserId: ver.authorUserId,
      parentVersionIds: ver.parentVersionIds,
    }));
  },
});