import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { assertCanWrite } from "./lib/authz";

async function getVersionHeads(ctx: MutationCtx, fileId: Id<"files">) {
  const versions = await ctx.db
    .query("versions")
    .withIndex("by_file", (q) => q.eq("fileId", fileId))
    .collect();

  const referenced = new Set<string>();
  for (const ver of versions) {
    for (const parent of ver.parentVersionIds ?? []) {
      referenced.add(parent);
    }
  }

  return versions.filter((ver) => !referenced.has(ver._id));
}

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