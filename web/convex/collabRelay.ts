import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { assertCanWrite } from "./lib/authz";
import { getVersionHeads } from "./lib/versionHeads";

export const insertCheckpoint = internalMutation({
  args: {
    secret: v.string(),
    fileId: v.id("files"),
    clerkUserId: v.string(),
    content: v.bytes(),
  },
  handler: async (ctx, args) => {
    const expected = process.env.COLLAB_RELAY_SECRET;
    if (!expected || args.secret !== expected) {
      throw new Error("FORBIDDEN");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", args.clerkUserId))
      .unique();
    if (!user) throw new Error("USER_NOT_FOUND");

    const file = await ctx.db.get(args.fileId);
    if (!file || file.type !== "file") throw new Error("NOT_A_FILE");

    await assertCanWrite(ctx, user._id, args.fileId);

    const versionId = await ctx.db.insert("versions", {
      fileId: args.fileId,
      content: args.content,
      authorUserId: user._id,
    });

    const heads = await getVersionHeads(ctx, args.fileId);
    const headIds = new Set(heads.map((h) => h._id));
    headIds.add(versionId);
    const activeHeads = [...headIds];

    if (activeHeads.length === 1) {
      await ctx.db.patch(args.fileId, {
        currentVersionId: versionId,
        forked: false,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(args.fileId, {
        forked: true,
        updatedAt: Date.now(),
      });
    }

    return versionId;
  },
});