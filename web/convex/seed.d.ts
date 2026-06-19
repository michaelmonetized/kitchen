import type { Id } from "./_generated/dataModel";
export declare const demo: import("convex/server").RegisteredMutation<"internal", {
    force?: boolean | undefined;
}, Promise<{
    orgId: import("convex/values").GenericId<"files">;
    skipped: boolean;
    projectId?: undefined;
    danaId?: undefined;
    samId?: undefined;
} | {
    orgId: import("convex/values").GenericId<"files">;
    projectId: import("convex/values").GenericId<"files">;
    danaId: Id<"users">;
    samId: Id<"users">;
    skipped: boolean;
}>>;
