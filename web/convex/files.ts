import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { assertCanWrite, hasAdmin } from "./lib/authz";
import { assertValidParent } from "./lib/invariants";
import { requireUser } from "./lib/session";

export const insert = mutation({
  args: {
    parentId: v.optional(v.id("files")),
    type: v.union(v.literal("dir"), v.literal("file")),
    name: v.string(),
    mime: v.optional(v.string()),
    properties: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    const parent = args.parentId ? await ctx.db.get(args.parentId) : null;
    assertValidParent(args.type, args.parentId, parent);

    if (args.parentId) {
      await assertCanWrite(ctx, user._id, args.parentId);
    }

    if (args.parentId) {
      const siblings = await ctx.db
        .query("files")
        .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
        .collect();
      if (siblings.some((s) => s.name === args.name)) {
        throw new Error("SIBLING_NAME_CONFLICT");
      }
    }

    return await ctx.db.insert("files", {
      type: args.type,
      name: args.name,
      parentId: args.parentId,
      mime: args.mime,
      properties: args.properties ?? {},
      forked: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateMetadata = mutation({
  args: {
    fileId: v.id("files"),
    name: v.optional(v.string()),
    parentId: v.optional(v.id("files")),
    properties: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const file = await ctx.db.get(args.fileId);
    if (!file) throw new Error("NOT_FOUND");

    await assertCanWrite(ctx, user._id, args.fileId);

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) patch.name = args.name;
    if (args.properties !== undefined) patch.properties = args.properties;
    if (args.parentId !== undefined) {
      const parent = await ctx.db.get(args.parentId);
      assertValidParent(file.type, args.parentId, parent);
      patch.parentId = args.parentId;
    }

    await ctx.db.patch(args.fileId, patch);
    return args.fileId;
  },
});

export const setCurrentVersion = mutation({
  args: {
    fileId: v.id("files"),
    versionId: v.id("versions"),
    forked: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await assertCanWrite(ctx, user._id, args.fileId);

    const version = await ctx.db.get(args.versionId);
    if (!version || version.fileId !== args.fileId) {
      throw new Error("INVALID_VERSION");
    }

    await ctx.db.patch(args.fileId, {
      currentVersionId: args.versionId,
      forked: args.forked,
      updatedAt: Date.now(),
    });
  },
});