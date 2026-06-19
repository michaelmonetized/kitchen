export declare const insertCheckpoint: import("convex/server").RegisteredMutation<"internal", {
    fileId: import("convex/values").GenericId<"files">;
    content: ArrayBuffer;
    secret: string;
    clerkUserId: string;
}, Promise<import("convex/values").GenericId<"versions">>>;
