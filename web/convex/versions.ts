import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { assertCanWrite } from "./lib/authz";
import { requireUser } from "./lib/session";
import { getVersionHeads } from "./lib/versionHeads";

export const insert = mutation({
  args: {
    fileId: v.id("files"),
    content: v.bytes(),
    parentVersionIds: v.optional(v.array(v.id("versions"))),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const file = await ctx.db.get(args.fileId);
    if (!file || file.type !== "file") throw new Error("NOT_A_FILE");

    await assertCanWrite(ctx, user._id, args.fileId);

    const versionId = await ctx.db.insert("versions", {
      fileId: args.fileId,
      content: args.content,
      authorUserId: user._id,
      parentVersionIds: args.parentVersionIds,
    });

    const heads = await getVersionHeads(ctx, args.fileId);
    const headIds = new Set(heads.map((h) => h._id));
    headIds.add(versionId);
    const activeHeads = [...headIds];

    const forked = activeHeads.length > 1;

    if (forked) {
      await ctx.db.patch(args.fileId, {
        forked: true,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(args.fileId, {
        currentVersionId: versionId,
        forked: false,
        updatedAt: Date.now(),
      });
    }

    return { forked };
  },
});

export const insertMerge = mutation({
  args: {
    fileId: v.id("files"),
    content: v.bytes(),
    parentVersionIds: v.array(v.id("versions")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const file = await ctx.db.get(args.fileId);
    if (!file || file.type !== "file") throw new Error("NOT_A_FILE");

    await assertCanWrite(ctx, user._id, args.fileId);

    if (args.parentVersionIds.length < 2) {
      throw new Error("MERGE_REQUIRES_TWO_PARENTS");
    }

    const heads = await getVersionHeads(ctx, args.fileId);
    const headIds = new Set(heads.map((h) => h._id));
    for (const parentId of args.parentVersionIds) {
      if (!headIds.has(parentId)) throw new Error("PARENT_NOT_HEAD");
      const parent = await ctx.db.get(parentId);
      if (!parent || parent.fileId !== args.fileId) {
        throw new Error("INVALID_PARENT");
      }
    }

    const versionId = await ctx.db.insert("versions", {
      fileId: args.fileId,
      content: args.content,
      authorUserId: user._id,
      parentVersionIds: args.parentVersionIds,
    });

    await ctx.db.patch(args.fileId, {
      currentVersionId: versionId,
      forked: false,
      updatedAt: Date.now(),
    });

    return versionId;
  },
});