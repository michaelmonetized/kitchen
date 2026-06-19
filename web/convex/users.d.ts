export declare const upsertFromClerk: import("convex/server").RegisteredMutation<"internal", {
    displayName?: string | undefined;
    clerkId: string;
    email: string;
}, Promise<import("convex/values").GenericId<"users">>>;
export declare const ensureCurrent: import("convex/server").RegisteredMutation<"public", {}, Promise<import("convex/values").GenericId<"users"> | null>>;
