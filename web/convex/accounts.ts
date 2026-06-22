import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import {
  defaultUsernamePlaceholder,
  ensureAccountForUser,
  normalizeUsername,
} from "./lib/account";
import { recordMetadataEvent } from "./lib/metadataAudit";
import { requireUser } from "./lib/session";

const MAX_ACTIVE_REDIRECTS = 5;

export const getCurrentAccount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    if (!user.accountFileId) return null;
    const account = await ctx.db.get(user.accountFileId);
    if (!account) return null;
    return {
      user: {
        _id: user._id,
        email: user.email,
        username: user.username ?? null,
        onboardingComplete: user.onboardingComplete ?? false,
      },
      account,
    };
  },
});

export const suggestedUsername = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return defaultUsernamePlaceholder(user.email);
  },
});

export const completeOnboarding = mutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const username = normalizeUsername(args.username);

    const taken = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (taken && taken._id !== user._id) {
      throw new ConvexError("USERNAME_TAKEN");
    }

    const accountId = await ensureAccountForUser(ctx, user);
    const account = await ctx.db.get(accountId);
    if (!account) throw new ConvexError("ACCOUNT_NOT_FOUND");

    const before = { ...account.properties };
    await ctx.db.patch(accountId, {
      name: username,
      updatedAt: Date.now(),
    });

    await ctx.db.patch(user._id, {
      username,
      onboardingComplete: true,
    });

    await recordMetadataEvent(ctx, {
      fileId: accountId,
      authorUserId: user._id,
      before,
      after: { ...before, username },
    });

    return { username, accountFileId: accountId };
  },
});

export const changeUsername = mutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const newUsername = normalizeUsername(args.username);
    const oldUsername = user.username;
    if (!oldUsername || oldUsername === newUsername) {
      throw new ConvexError("INVALID_USERNAME");
    }

    const taken = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", newUsername))
      .unique();
    if (taken) throw new ConvexError("USERNAME_TAKEN");

    if (!user.accountFileId) throw new ConvexError("ACCOUNT_NOT_FOUND");

    await ctx.db.patch(user._id, {
      username: newUsername,
      usernameChangeCount: (user.usernameChangeCount ?? 0) + 1,
    });

    await ctx.db.patch(user.accountFileId, {
      name: newUsername,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("username_redirects", {
      fromUsername: oldUsername,
      toUsername: newUsername,
      userId: user._id,
      createdAt: Date.now(),
      dropped: false,
    });

    const redirects = await ctx.db
      .query("username_redirects")
      .withIndex("by_from", (q) => q.eq("fromUsername", oldUsername))
      .collect();

    const activeForUser = (
      await ctx.db
        .query("username_redirects")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), user._id),
            q.eq(q.field("dropped"), false),
          ),
        )
        .collect()
    ).sort((a, b) => a.createdAt - b.createdAt);

    if (activeForUser.length > MAX_ACTIVE_REDIRECTS) {
      const toDrop = activeForUser.slice(0, activeForUser.length - MAX_ACTIVE_REDIRECTS);
      for (const row of toDrop) {
        await ctx.db.patch(row._id, { dropped: true });
      }
    }

    return { username: newUsername, redirects: redirects.length };
  },
});

export const resolveUsernameRedirect = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const from = args.username.trim().toLowerCase();
    const row = await ctx.db
      .query("username_redirects")
      .withIndex("by_from", (q) => q.eq("fromUsername", from).eq("dropped", false))
      .first();
    if (!row) return null;
    return row.toUsername;
  },
});