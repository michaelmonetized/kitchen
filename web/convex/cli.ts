import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { canRead, canReadAnonymous } from "./lib/authz";
import { isDeleted } from "./lib/deleted";
import { getUserOptional } from "./lib/session";
import { projectSlug } from "./lib/slugify";

type TreeNode = {
  _id: Id<"files">;
  parentId: Id<"files">;
  name: string;
  type: "dir" | "file";
};

function resolveFileId(
  nodes: TreeNode[],
  projectId: Id<"files">,
  relativePath: string,
): Id<"files"> | null {
  const segments = relativePath.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  let parentId: Id<"files"> = projectId;
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const isLast = i === segments.length - 1;
    const node = nodes.find(
      (row) =>
        row.parentId === parentId &&
        row.name === segment &&
        row.type === (isLast ? "file" : "dir"),
    );
    if (!node) return null;
    if (isLast) return node._id;
    parentId = node._id;
  }
  return null;
}

async function collectTreeNodes(
  ctx: Parameters<typeof canRead>[0],
  projectId: Id<"files">,
  canAccess: (fileId: Id<"files">) => Promise<boolean>,
): Promise<TreeNode[]> {
  const nodes: TreeNode[] = [];

  async function walk(parentId: Id<"files">) {
    const rows = await ctx.db
      .query("files")
      .withIndex("by_parent", (q) => q.eq("parentId", parentId))
      .collect();

    for (const row of rows) {
      if (isDeleted(row.properties)) continue;
      if (!(await canAccess(row._id))) continue;
      nodes.push({
        _id: row._id,
        parentId,
        name: row.name,
        type: row.type,
      });
      if (row.type === "dir") await walk(row._id);
    }
  }

  await walk(projectId);
  return nodes;
}

/** Resolve a project-relative path to a file id (authenticated or public anonymous). */
export const resolveFileByPath = query({
  args: {
    projectId: v.id("files"),
    relativePath: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserOptional(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.type !== "dir") return null;

    const canAccess = user
      ? (fileId: Id<"files">) => canRead(ctx, user._id, fileId)
      : (fileId: Id<"files">) => canReadAnonymous(ctx, fileId);

    if (!(await canAccess(args.projectId))) return null;

    const nodes = await collectTreeNodes(ctx, args.projectId, canAccess);
    const fileId = resolveFileId(nodes, args.projectId, args.relativePath);
    if (!fileId) return null;

    return {
      fileId,
      isPublic: !user && (await canReadAnonymous(ctx, fileId)),
    };
  },
});

/** List version inserts for CLI `kitchen changes` (authenticated or public anonymous). */
export const listChanges = query({
  args: {
    fileId: v.id("files"),
    since: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUserOptional(ctx);
    const file = await ctx.db.get(args.fileId);
    if (!file || file.type !== "file") return { error: "NOT_FOUND" as const, changes: [] };

    const allowed = user
      ? await canRead(ctx, user._id, args.fileId)
      : await canReadAnonymous(ctx, args.fileId);
    if (!allowed) return { error: "FORBIDDEN" as const, changes: [] };

    const all = await ctx.db
      .query("versions")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .order("desc")
      .collect();

    const sinceMs = args.since ?? 0;
    const limit = args.limit ?? 50;
    const filtered = all
      .filter((ver) => ver._creationTime >= sinceMs)
      .slice(0, limit);

    return {
      error: null,
      changes: filtered.map((ver) => ({
        id: ver._id,
        creationTime: ver._creationTime,
        authorUserId: ver.authorUserId,
        parentVersionIds: ver.parentVersionIds,
      })),
    };
  },
});

/** Authenticated: map mirror top-level name → project id. */
export const projectIdForSlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserOptional(ctx);
    if (!user) return null;

    const slug = args.slug.trim();

    if (user.accountFileId) {
      const match = await ctx.db
        .query("files")
        .withIndex("by_parent", (q) =>
          q.eq("parentId", user.accountFileId!).eq("name", slug),
        )
        .unique();
      if (match && match.type === "dir" && (await canRead(ctx, user._id, match._id))) {
        return match._id;
      }
    }

    const assignments = await ctx.db
      .query("user_roles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const orgIds = new Set<Id<"files">>();
    for (const assignment of assignments) {
      const role = await ctx.db.get(assignment.roleId);
      if (role) orgIds.add(role.orgFileId);
    }

    for (const orgId of orgIds) {
      const org = await ctx.db.get(orgId);
      if (!org) continue;

      const children = await ctx.db
        .query("files")
        .withIndex("by_parent", (q) => q.eq("parentId", org._id))
        .collect();

      for (const child of children) {
        if (child.type !== "dir") continue;
        if (!(await canRead(ctx, user._id, child._id))) continue;
        if (child.name === slug || projectSlug(child.name, org.name) === slug) {
          return child._id;
        }
      }
    }
    return null;
  },
});

/** Public: resolve username/project → project id. */
export const publicProjectId = query({
  args: {
    username: v.string(),
    projectName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username.trim().toLowerCase()))
      .unique();
    if (!user?.accountFileId) return null;

    const project = await ctx.db
      .query("files")
      .withIndex("by_parent", (q) =>
        q.eq("parentId", user.accountFileId!).eq("name", args.projectName),
      )
      .unique();

    if (!project || project.type !== "dir") return null;
    if (!(await canReadAnonymous(ctx, project._id))) return null;
    return project._id;
  },
});