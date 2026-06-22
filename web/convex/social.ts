import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { canReadAnonymous } from "./lib/authz";
import { isDeleted } from "./lib/deleted";
import { getUserOptional } from "./lib/session";

export const listPublicProjects = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const users = await ctx.db.query("users").collect();
    const results: {
      username: string;
      projectId: string;
      projectName: string;
      ownerEmail: string;
    }[] = [];

    for (const user of users) {
      if (!user.username || !user.accountFileId) continue;
      const children = await ctx.db
        .query("files")
        .withIndex("by_parent", (q) => q.eq("parentId", user.accountFileId))
        .collect();

      for (const project of children) {
        if (project.type !== "dir" || isDeleted(project.properties)) continue;
        if (!(await canReadAnonymous(ctx, project._id))) continue;
        results.push({
          username: user.username,
          projectId: project._id,
          projectName: project.name,
          ownerEmail: user.email,
        });
        if (results.length >= limit) return results;
      }
    }

    return results.sort((a, b) =>
      `${a.username}/${a.projectName}`.localeCompare(`${b.username}/${b.projectName}`),
    );
  },
});

export const getPublicProjectByPath = query({
  args: {
    username: v.string(),
    projectName: v.string(),
  },
  handler: async (ctx, args) => {
    const username = args.username.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (!user?.accountFileId) return null;

    const project = await ctx.db
      .query("files")
      .withIndex("by_parent", (q) =>
        q.eq("parentId", user.accountFileId).eq("name", args.projectName),
      )
      .unique();

    if (!project || project.type !== "dir" || isDeleted(project.properties)) {
      return null;
    }
    if (!(await canReadAnonymous(ctx, project._id))) return null;

    const viewer = await getUserOptional(ctx);

    return {
      project,
      owner: {
        username: user.username!,
        email: viewer ? user.email : undefined,
        displayName: user.displayName,
      },
      isOwner: viewer?._id === user._id,
    };
  },
});

export const listPublicProjectTree = query({
  args: { projectId: v.id("files") },
  handler: async (ctx, args) => {
    if (!(await canReadAnonymous(ctx, args.projectId))) return [];

    const project = await ctx.db.get(args.projectId);
    if (!project || project.type !== "dir") return [];

    const nodes: {
      _id: Id<"files">;
      parentId: Id<"files">;
      name: string;
      type: "dir" | "file";
      forked: boolean;
    }[] = [];

    async function walk(parentId: Id<"files">) {
      const rows = await ctx.db
        .query("files")
        .withIndex("by_parent", (q) => q.eq("parentId", parentId))
        .collect();

      for (const row of rows) {
        if (isDeleted(row.properties)) continue;
        if (!(await canReadAnonymous(ctx, row._id))) continue;
        nodes.push({
          _id: row._id,
          parentId,
          name: row.name,
          type: row.type,
          forked: row.forked,
        });
        if (row.type === "dir") await walk(row._id);
      }
    }

    await walk(args.projectId);
    return nodes;
  },
});