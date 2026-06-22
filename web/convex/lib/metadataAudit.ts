import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export async function recordMetadataEvent(
  ctx: MutationCtx,
  args: {
    fileId: Id<"files">;
    authorUserId: Id<"users">;
    before: Record<string, string>;
    after: Record<string, string>;
  },
): Promise<void> {
  await ctx.db.insert("file_metadata_events", {
    fileId: args.fileId,
    authorUserId: args.authorUserId,
    before: args.before,
    after: args.after,
    createdAt: Date.now(),
  });
}