import type { MutationCtx, QueryCtx } from "../_generated/server";
type Ctx = QueryCtx | MutationCtx;
export declare function requireUser(ctx: Ctx): Promise<{
    _id: import("convex/values").GenericId<"users">;
    _creationTime: number;
    displayName?: string | undefined;
    clerkId: string;
    email: string;
    createdAt: number;
}>;
export declare function getUserOptional(ctx: Ctx): Promise<{
    _id: import("convex/values").GenericId<"users">;
    _creationTime: number;
    displayName?: string | undefined;
    clerkId: string;
    email: string;
    createdAt: number;
} | null>;
export {};
