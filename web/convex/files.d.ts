export declare const insert: import("convex/server").RegisteredMutation<"public", {
    parentId?: import("convex/values").GenericId<"files"> | undefined;
    mime?: string | undefined;
    properties?: Record<string, string> | undefined;
    type: "dir" | "file";
    name: string;
}, Promise<import("convex/values").GenericId<"files">>>;
export declare const updateMetadata: import("convex/server").RegisteredMutation<"public", {
    name?: string | undefined;
    parentId?: import("convex/values").GenericId<"files"> | undefined;
    properties?: Record<string, string> | undefined;
    fileId: import("convex/values").GenericId<"files">;
}, Promise<import("convex/values").GenericId<"files">>>;
export declare const setCurrentVersion: import("convex/server").RegisteredMutation<"public", {
    forked: boolean;
    fileId: import("convex/values").GenericId<"files">;
    versionId: import("convex/values").GenericId<"versions">;
}, Promise<void>>;
