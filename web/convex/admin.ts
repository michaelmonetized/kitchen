import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";
import { hasAdmin } from "./lib/authz";
import { isOrg } from "./lib/invariants";
import { requireUser } from "./lib/session";

type ReadCtx = QueryCtx | MutationCtx;
type WriteCtx = MutationCtx;

const DEFAULT_PROJECT_PROPERTIES = {
  "role:editor": "write",
  "role:viewer": "read",
} as const;

const DEFAULT_ROLES = [
  { name: "admin", permissions: ["read", "write", "admin"] },
  { name: "editor", permissions: ["read", "write"] },
  { name: "viewer", permissions: ["read"] },
] as const;

async function userOrgRoles(ctx: ReadCtx, userId: Id<"users">) {
  const assignments = await ctx.db
    .query("user_roles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const byOrg = new Map<
    Id<"files">,
    { roles: string[]; hasAdmin: boolean }
  >();

  for (const assignment of assignments) {
    const role = await ctx.db.get(assignment.roleId);
    if (!role) continue;

    const entry = byOrg.get(role.orgFileId) ?? { roles: [], hasAdmin: false };
    entry.roles.push(role.name);
    if (role.permissions.includes("admin")) entry.hasAdmin = true;
    byOrg.set(role.orgFileId, entry);
  }

  return byOrg;
}

async function assertOrgAdmin(ctx: ReadCtx, userId: Id<"users">, orgId: Id<"files">) {
  const org = await ctx.db.get(orgId);
  if (!org || !isOrg(org)) throw new ConvexError("ORG_NOT_FOUND");
  if (!(await hasAdmin(ctx, userId, orgId))) {
    throw new ConvexError("FORBIDDEN");
  }
  return org;
}

async function upsertUserByEmail(ctx: WriteCtx, email: string): Promise<Id<"users">> {
  const normalized = email.trim().toLowerCase();
  const existing = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", normalized))
    .unique();

  if (existing) return existing._id;

  return await ctx.db.insert("users", {
    clerkId: `pending:${normalized}`,
    email: normalized,
    createdAt: Date.now(),
  });
}

async function ensureDefaultRoles(ctx: WriteCtx, orgId: Id<"files">) {
  const roleIds: Record<string, Id<"roles">> = {};

  for (const spec of DEFAULT_ROLES) {
    const existing = await ctx.db
      .query("roles")
      .withIndex("by_org", (q) => q.eq("orgFileId", orgId).eq("name", spec.name))
      .unique();

    if (existing) {
      roleIds[spec.name] = existing._id;
      continue;
    }

    roleIds[spec.name] = await ctx.db.insert("roles", {
      orgFileId: orgId,
      name: spec.name,
      permissions: [...spec.permissions],
    });
  }

  return roleIds;
}

export const listOrgsForUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const orgMap = await userOrgRoles(ctx, user._id);

    const orgs = [];
    for (const [orgId, meta] of orgMap) {
      const org = await ctx.db.get(orgId);
      if (!org || !isOrg(org)) continue;
      orgs.push({
        org,
        roles: meta.roles,
        isAdmin: meta.hasAdmin,
      });
    }

    return orgs.sort((a, b) => a.org.name.localeCompare(b.org.name));
  },
});

export const getOrgContext = query({
  args: { orgId: v.id("files") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const org = await ctx.db.get(args.orgId);
    if (!org || !isOrg(org)) return null;

    const orgMap = await userOrgRoles(ctx, user._id);
    const membership = orgMap.get(args.orgId);
    if (!membership) return null;

    const isAdmin = membership.hasAdmin;

    const projects = await ctx.db
      .query("files")
      .withIndex("by_parent", (q) => q.eq("parentId", args.orgId))
      .collect();

    const projectDirs = projects.filter((p) => p.type === "dir");

    const roles = await ctx.db
      .query("roles")
      .withIndex("by_org", (q) => q.eq("orgFileId", args.orgId))
      .collect();

    const assignments = [];
    for (const role of roles) {
      const roleAssignments = await ctx.db
        .query("user_roles")
        .withIndex("by_role", (q) => q.eq("roleId", role._id))
        .collect();

      for (const assignment of roleAssignments) {
        const member = await ctx.db.get(assignment.userId);
        if (!member) continue;

        let projectName: string | undefined;
        if (assignment.projectFileId) {
          const project = await ctx.db.get(assignment.projectFileId);
          projectName = project?.name;
        }

        assignments.push({
          assignmentId: assignment._id,
          userId: member._id,
          email: member.email,
          displayName: member.displayName,
          roleId: role._id,
          roleName: role.name,
          projectFileId: assignment.projectFileId,
          projectName,
        });
      }
    }

    return {
      org,
      isAdmin,
      roles: isAdmin
        ? roles
        : roles.map((r) => ({ _id: r._id, name: r.name, permissions: r.permissions })),
      projects: projectDirs.map((p) => ({
        _id: p._id,
        name: p.name,
        properties: isAdmin ? p.properties : undefined,
      })),
      members: isAdmin
        ? assignments
        : assignments.filter((a) => a.userId === user._id),
      userRoles: membership.roles,
    };
  },
});

export const createOrg = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const name = args.name.trim();
    const slug = args.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");

    if (!name || !slug) throw new ConvexError("INVALID_INPUT");

    const now = Date.now();
    const orgId = await ctx.db.insert("files", {
      type: "dir",
      name,
      parentId: undefined,
      properties: {
        [`org:${slug}`]: user.email,
      },
      forked: false,
      createdAt: now,
      updatedAt: now,
    });

    const roleIds = await ensureDefaultRoles(ctx, orgId);

    await ctx.db.insert("user_roles", {
      userId: user._id,
      roleId: roleIds.admin,
    });

    return orgId;
  },
});

export const createProject = mutation({
  args: {
    orgId: v.id("files"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await assertOrgAdmin(ctx, user._id, args.orgId);

    const name = args.name.trim();
    if (!name) throw new ConvexError("INVALID_INPUT");

    const siblings = await ctx.db
      .query("files")
      .withIndex("by_parent", (q) => q.eq("parentId", args.orgId))
      .collect();
    if (siblings.some((s) => s.name === name)) {
      throw new ConvexError("SIBLING_NAME_CONFLICT");
    }

    const now = Date.now();
    return await ctx.db.insert("files", {
      type: "dir",
      name,
      parentId: args.orgId,
      properties: { ...DEFAULT_PROJECT_PROPERTIES },
      forked: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createRole = mutation({
  args: {
    orgId: v.id("files"),
    name: v.string(),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await assertOrgAdmin(ctx, user._id, args.orgId);

    const name = args.name.trim().toLowerCase();
    if (!name) throw new ConvexError("INVALID_INPUT");

    const existing = await ctx.db
      .query("roles")
      .withIndex("by_org", (q) => q.eq("orgFileId", args.orgId).eq("name", name))
      .unique();
    if (existing) throw new ConvexError("ROLE_EXISTS");

    return await ctx.db.insert("roles", {
      orgFileId: args.orgId,
      name,
      permissions: args.permissions,
    });
  },
});

export const updateRole = mutation({
  args: {
    roleId: v.id("roles"),
    name: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const role = await ctx.db.get(args.roleId);
    if (!role) throw new ConvexError("ROLE_NOT_FOUND");

    await assertOrgAdmin(ctx, user._id, role.orgFileId);

    const patch: Partial<Pick<Doc<"roles">, "name" | "permissions">> = {};
    if (args.name !== undefined) {
      const name = args.name.trim().toLowerCase();
      if (!name) throw new ConvexError("INVALID_INPUT");
      patch.name = name;
    }
    if (args.permissions !== undefined) patch.permissions = args.permissions;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.roleId, patch);
    }

    return args.roleId;
  },
});

export const deleteRole = mutation({
  args: { roleId: v.id("roles") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const role = await ctx.db.get(args.roleId);
    if (!role) throw new ConvexError("ROLE_NOT_FOUND");

    await assertOrgAdmin(ctx, user._id, role.orgFileId);

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

export const inviteMember = mutation({
  args: {
    orgId: v.id("files"),
    email: v.string(),
    roleId: v.id("roles"),
    projectFileId: v.optional(v.id("files")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await assertOrgAdmin(ctx, user._id, args.orgId);

    const role = await ctx.db.get(args.roleId);
    if (!role || role.orgFileId !== args.orgId) {
      throw new ConvexError("ROLE_NOT_FOUND");
    }

    if (args.projectFileId) {
      const project = await ctx.db.get(args.projectFileId);
      if (!project || project.parentId !== args.orgId) {
        throw new ConvexError("INVALID_PROJECT");
      }
    }

    const memberId = await upsertUserByEmail(ctx, args.email);

    const existing = await ctx.db
      .query("user_roles")
      .withIndex("by_user", (q) => q.eq("userId", memberId))
      .collect();

    const duplicate = existing.find(
      (a) =>
        a.roleId === args.roleId &&
        a.projectFileId === args.projectFileId,
    );
    if (duplicate) throw new ConvexError("ALREADY_ASSIGNED");

    return await ctx.db.insert("user_roles", {
      userId: memberId,
      roleId: args.roleId,
      projectFileId: args.projectFileId,
    });
  },
});

export const removeMember = mutation({
  args: { assignmentId: v.id("user_roles") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new ConvexError("NOT_FOUND");

    const role = await ctx.db.get(assignment.roleId);
    if (!role) throw new ConvexError("ROLE_NOT_FOUND");

    await assertOrgAdmin(ctx, user._id, role.orgFileId);
    await ctx.db.delete(args.assignmentId);
  },
});

export const setProjectProperties = mutation({
  args: {
    projectId: v.id("files"),
    properties: v.record(v.string(), v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.type !== "dir" || !project.parentId) {
      throw new ConvexError("NOT_FOUND");
    }

    await assertOrgAdmin(ctx, user._id, project.parentId);

    await ctx.db.patch(args.projectId, {
      properties: args.properties,
      updatedAt: Date.now(),
    });
  },
});

export const transferProjectOwnership = mutation({
  args: {
    projectId: v.id("files"),
    newOwnerEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.type !== "dir" || !project.parentId) {
      throw new ConvexError("NOT_FOUND");
    }

    const orgId = project.parentId;
    await assertOrgAdmin(ctx, user._id, orgId);

    const org = await ctx.db.get(orgId);
    if (!org) throw new ConvexError("ORG_NOT_FOUND");

    const newOwnerId = await upsertUserByEmail(ctx, args.newOwnerEmail);
    const newOwner = await ctx.db.get(newOwnerId);
    if (!newOwner) throw new ConvexError("USER_NOT_FOUND");

    const roleIds = await ensureDefaultRoles(ctx, orgId);

    const newOwnerAssignments = await ctx.db
      .query("user_roles")
      .withIndex("by_user", (q) => q.eq("userId", newOwnerId))
      .collect();

    const hasAdminRole = newOwnerAssignments.some((a) => a.roleId === roleIds.admin);
    if (!hasAdminRole) {
      await ctx.db.insert("user_roles", {
        userId: newOwnerId,
        roleId: roleIds.admin,
      });
    }

    const orgKey = Object.keys(org.properties).find((k) => k.startsWith("org:"));
    const updatedProperties = { ...project.properties };
    if (orgKey) {
      const emails = (org.properties[orgKey] ?? "")
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
      if (!emails.includes(newOwner.email)) {
        emails.push(newOwner.email);
      }
      await ctx.db.patch(orgId, {
        properties: {
          ...org.properties,
          [orgKey]: emails.join(","),
        },
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(args.projectId, {
      properties: {
        ...updatedProperties,
        "owner:email": newOwner.email,
      },
      updatedAt: Date.now(),
    });

    return { projectId: args.projectId, newOwnerEmail: newOwner.email };
  },
});

export const ensurePersonalOrg = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const orgMap = await userOrgRoles(ctx, user._id);
    if (orgMap.size > 0) return null;

    const slug = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const now = Date.now();

    const orgId = await ctx.db.insert("files", {
      type: "dir",
      name: `${user.displayName ?? slug}'s Org`,
      parentId: undefined,
      properties: {
        [`org:${slug}`]: user.email,
      },
      forked: false,
      createdAt: now,
      updatedAt: now,
    });

    const roleIds = await ensureDefaultRoles(ctx, orgId);

    await ctx.db.insert("user_roles", {
      userId: user._id,
      roleId: roleIds.admin,
    });

    const projectId = await ctx.db.insert("files", {
      type: "dir",
      name: "sample-project",
      parentId: orgId,
      properties: { ...DEFAULT_PROJECT_PROPERTIES },
      forked: false,
      createdAt: now,
      updatedAt: now,
    });

    return { orgId, projectId };
  },
});