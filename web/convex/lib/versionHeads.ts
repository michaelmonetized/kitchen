import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function getVersionHeads(
  ctx: MutationCtx | QueryCtx,
  fileId: Id<"files">,
) {
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