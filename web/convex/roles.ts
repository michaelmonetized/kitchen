import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { hasAdmin } from "./lib/authz";
import { requireUser } from "./lib/session";

export const insert = mutation({
  args: {
    orgFileId: v.id("files"),
    name: v.string(),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!(await hasAdmin(ctx, user._id, args.orgFileId))) {
      throw new Error("FORBIDDEN");
    }

    const existing = await ctx.db
      .query("roles")
      .withIndex("by_org", (q) =>
        q.eq("orgFileId", args.orgFileId).eq("name", args.name),
      )
      .unique();
    if (existing) throw new Error("ROLE_EXISTS");

    return await ctx.db.insert("roles", {
      orgFileId: args.orgFileId,
      name: args.name,
      permissions: args.permissions,
    });
  },
});

export const assignUser = mutation({
  args: {
    userId: v.id("users"),
    roleId: v.id("roles"),
    projectFileId: v.optional(v.id("files")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const role = await ctx.db.get(args.roleId);
    if (!role) throw new Error("ROLE_NOT_FOUND");

    if (!(await hasAdmin(ctx, user._id, role.orgFileId))) {
      throw new Error("FORBIDDEN");
    }

    return await ctx.db.insert("user_roles", {
      userId: args.userId,
      roleId: args.roleId,
      projectFileId: args.projectFileId,
    });
  },
});

export const update = mutation({
  args: {
    roleId: v.id("roles"),
    name: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const role = await ctx.db.get(args.roleId);
    if (!role) throw new Error("ROLE_NOT_FOUND");

    if (!(await hasAdmin(ctx, user._id, role.orgFileId))) {
      throw new Error("FORBIDDEN");
    }

    const patch: { name?: string; permissions?: string[] } = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.permissions !== undefined) patch.permissions = args.permissions;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.roleId, patch);
    }

    return args.roleId;
  },
});

export const remove = mutation({
  args: { roleId: v.id("roles") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const role = await ctx.db.get(args.roleId);
    if (!role) throw new Error("ROLE_NOT_FOUND");

    if (!(await hasAdmin(ctx, user._id, role.orgFileId))) {
      throw new Error("FORBIDDEN");
    }

    const assignments = await ctx.db
      .query("user_roles")
      .withIndex("by_role", (q) => q.eq("roleId", args.roleId))
      .collect();

    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    await ctx.db.delete(args.roleId);
  },
});