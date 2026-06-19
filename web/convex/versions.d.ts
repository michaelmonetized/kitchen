export declare const insert: import("convex/server").RegisteredMutation<"public", {
    parentVersionIds?: import("convex/values").GenericId<"versions">[] | undefined;
    fileId: import("convex/values").GenericId<"files">;
    content: ArrayBuffer;
}, Promise<{
    forked: boolean;
}>>;
export declare const insertMerge: import("convex/server").RegisteredMutation<"public", {
    fileId: import("convex/values").GenericId<"files">;
    content: ArrayBuffer;
    parentVersionIds: import("convex/values").GenericId<"versions">[];
}, Promise<import("convex/values").GenericId<"versions">>>;
