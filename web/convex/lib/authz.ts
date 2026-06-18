import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { ConvexError } from "convex/values";

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
  const org = chain.find((f) => f.parentId === undefined);
  if (!org) throw new ConvexError("ORG_NOT_FOUND");
  return org._id;
}

async function userRoleNames(ctx: Ctx, userId: Id<"users">, orgId: Id<"files">) {
  const assignments = await ctx.db
    .query("user_roles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const names = new Set<string>();
  for (const assignment of assignments) {
    const role = await ctx.db.get(assignment.roleId);
    if (!role || role.orgFileId !== orgId) continue;
    names.add(role.name);
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

export async function canRead(
  ctx: Ctx,
  userId: Id<"users">,
  fileId: Id<"files">,
): Promise<boolean> {
  const chain = await getAncestorChain(ctx, fileId);
  if (chain.length === 0) return false;
  const orgId = chain.find((f) => f.parentId === undefined)!._id;
  const props = mergeProperties(chain);
  const roles = await userRoleNames(ctx, userId, orgId);
  return hasGrant(props, roles, "read");
}

export async function canWrite(
  ctx: Ctx,
  userId: Id<"users">,
  fileId: Id<"files">,
): Promise<boolean> {
  const chain = await getAncestorChain(ctx, fileId);
  if (chain.length === 0) return false;
  const orgId = chain.find((f) => f.parentId === undefined)!._id;
  const props = mergeProperties(chain);
  const roles = await userRoleNames(ctx, userId, orgId);
  return hasGrant(props, roles, "write");
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