import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ensureAccountForUser } from "./lib/account";

export const upsertFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        displayName: args.displayName,
      });
      return existing._id;
    }

    const byEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (byEmail) {
      await ctx.db.patch(byEmail._id, {
        clerkId: args.clerkId,
        displayName: args.displayName,
      });
      return byEmail._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      displayName: args.displayName,
      createdAt: Date.now(),
    });
  },
});

export const ensureCurrent = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return null;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) {
      await ensureAccountForUser(ctx, existing);
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email,
      displayName: identity.name ?? undefined,
      onboardingComplete: false,
      usernameChangeCount: 0,
      createdAt: Date.now(),
    });

    const user = await ctx.db.get(userId);
    if (user) await ensureAccountForUser(ctx, user);
    return userId;
  },
});