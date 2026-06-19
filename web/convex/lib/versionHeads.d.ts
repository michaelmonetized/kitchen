import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
export declare function getVersionHeads(ctx: MutationCtx | QueryCtx, fileId: Id<"files">): Promise<{
    _id: import("convex/values").GenericId<"versions">;
    _creationTime: number;
    parentVersionIds?: import("convex/values").GenericId<"versions">[] | undefined;
    fileId: import("convex/values").GenericId<"files">;
    content: ArrayBuffer;
    authorUserId: import("convex/values").GenericId<"users">;
}[]>;
