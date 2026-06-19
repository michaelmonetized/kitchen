export declare const insert: import("convex/server").RegisteredMutation<"public", {
    orgFileId: import("convex/values").GenericId<"files">;
    name: string;
    permissions: string[];
}, Promise<import("convex/values").GenericId<"roles">>>;
export declare const assignUser: import("convex/server").RegisteredMutation<"public", {
    projectFileId?: import("convex/values").GenericId<"files"> | undefined;
    userId: import("convex/values").GenericId<"users">;
    roleId: import("convex/values").GenericId<"roles">;
}, Promise<import("convex/values").GenericId<"user_roles">>>;
export declare const update: import("convex/server").RegisteredMutation<"public", {
    name?: string | undefined;
    permissions?: string[] | undefined;
    roleId: import("convex/values").GenericId<"roles">;
}, Promise<import("convex/values").GenericId<"roles">>>;
export declare const remove: import("convex/server").RegisteredMutation<"public", {
    roleId: import("convex/values").GenericId<"roles">;
}, Promise<void>>;
