import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { ConvexError } from "convex/values";
import {
  findOrgIdForProject,
  isAccountFile,
  isLegacyOrgFile,
  projectRootFromChain,
} from "./account";

type Ctx = QueryCtx | MutationCtx;

async function getAncestorChain(ctx: Ctx, fileId: Id<"files">) {
  const chain: Doc<"files">[] = [];
  let current = await ctx.db.get(fileId);
  while (current) {
    chain.push(current);
    if (current.parentId === undefined) break;
    current = await ctx.db.get(current.parentId);
  }
  return chain;
}

function mergeProperties(chain: Doc<"files">[]): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const file of [...chain].reverse()) {
    Object.assign(merged, file.properties);
  }
  return merged;
}

export async function getOrgId(ctx: Ctx, fileId: Id<"files">): Promise<Id<"files">> {
  const chain = await getAncestorChain(ctx, fileId);
  const project = projectRootFromChain(chain);
  if (project) {
    const orgFromProject = await findOrgIdForProject(ctx, project);
    if (orgFromProject) return orgFromProject;
  }
  const org = chain.find((f) => isLegacyOrgFile(f));
  if (!org) throw new ConvexError("ORG_NOT_FOUND");
  return org._id;
}

async function userRoleNames(
  ctx: Ctx,
  userId: Id<"users">,
  orgId: Id<"files">,
  projectFileId?: Id<"files">,
) {
  const assignments = await ctx.db
    .query("user_roles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const names = new Set<string>();
  for (const assignment of assignments) {
    const role = await ctx.db.get(assignment.roleId);
    if (!role || role.orgFileId !== orgId) continue;
    if (assignment.projectFileId === undefined) {
      names.add(role.name);
      continue;
    }
    if (projectFileId !== undefined && assignment.projectFileId === projectFileId) {
      names.add(role.name);
    }
  }
  return names;
}

function hasGrant(
  props: Record<string, string>,
  roleNames: Set<string>,
  level: "read" | "write",
): boolean {
  for (const [key, value] of Object.entries(props)) {
    if (!key.startsWith("role:")) continue;
    const roleName = key.slice("role:".length);
    if (!roleNames.has(roleName)) continue;
    if (level === "write" && value === "write") return true;
    if (level === "read" && (value === "read" || value === "write")) return true;
  }
  return false;
}

function ownerEmail(props: Record<string, string>): string | undefined {
  return props.owner?.trim().toLowerCase();
}

/** Anonymous read when merged properties grant `role:public: read` (not `deny`). */
export async function canReadAnonymous(
  ctx: Ctx,
  fileId: Id<"files">,
): Promise<boolean> {
  const chain = await getAncestorChain(ctx, fileId);
  if (chain.length === 0) return false;
  const props = mergeProperties(chain);
  if (props["role:public"] === "deny") return false;
  return props["role:public"] === "read";
}

export async function canRead(
  ctx: Ctx,
  userId: Id<"users">,
  fileId: Id<"files">,
): Promise<boolean> {
  const chain = await getAncestorChain(ctx, fileId);
  if (chain.length === 0) return false;

  const user = await ctx.db.get(userId);
  if (!user) return false;

  const props = mergeProperties(chain);
  const owner = ownerEmail(props);
  if (owner && owner === user.email.trim().toLowerCase()) return true;

  const project = projectRootFromChain(chain);
  const projectId = project?._id;

  try {
    const orgId = await getOrgId(ctx, fileId);
    if (await hasAdmin(ctx, userId, orgId)) return true;
    const roles = await userRoleNames(ctx, userId, orgId, projectId);
    if (hasGrant(props, roles, "read")) return true;
  } catch {
    // Account-only project without org attachment
    if (props["role:user"] === "read" || props["role:user"] === "write") {
      if (owner === user.email.trim().toLowerCase()) return true;
    }
  }

  return false;
}

export async function canWrite(
  ctx: Ctx,
  userId: Id<"users">,
  fileId: Id<"files">,
): Promise<boolean> {
  const chain = await getAncestorChain(ctx, fileId);
  if (chain.length === 0) return false;

  const user = await ctx.db.get(userId);
  if (!user) return false;

  const props = mergeProperties(chain);
  const owner = ownerEmail(props);
  if (owner && owner === user.email.trim().toLowerCase()) {
    if (props["role:user"] === "write") return true;
  }

  const project = projectRootFromChain(chain);
  const projectId = project?._id;

  try {
    const orgId = await getOrgId(ctx, fileId);
    if (await hasAdmin(ctx, userId, orgId)) return true;
    const roles = await userRoleNames(ctx, userId, orgId, projectId);
    return hasGrant(props, roles, "write");
  } catch {
    return owner === user.email.trim().toLowerCase() && props["role:user"] === "write";
  }
}

export async function assertCanRead(
  ctx: Ctx,
  userId: Id<"users">,
  fileId: Id<"files">,
) {
  if (!(await canRead(ctx, userId, fileId))) {
    throw new ConvexError("FORBIDDEN");
  }
}

export async function assertCanWrite(
  ctx: Ctx,
  userId: Id<"users">,
  fileId: Id<"files">,
) {
  if (!(await canWrite(ctx, userId, fileId))) {
    throw new ConvexError("FORBIDDEN");
  }
}

export async function hasAdmin(
  ctx: Ctx,
  userId: Id<"users">,
  orgId: Id<"files">,
): Promise<boolean> {
  const assignments = await ctx.db
    .query("user_roles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  for (const assignment of assignments) {
    const role = await ctx.db.get(assignment.roleId);
    if (!role || role.orgFileId !== orgId) continue;
    if (role.permissions.includes("admin")) return true;
  }
  return false;
}

export { isAccountFile, isLegacyOrgFile };