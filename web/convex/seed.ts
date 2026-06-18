import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const DEMO_ORG = {
  name: "Acme Corp",
  slug: "acme-corp",
  projectName: "acme-web",
} as const;

const DEMO_USERS = [
  { email: "dana@acme.example.com", displayName: "Dana Admin", clerkId: "demo:dana" },
  { email: "sam@acme.example.com", displayName: "Sam Editor", clerkId: "demo:sam" },
] as const;

export const demo = internalMutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const existingOrg = await ctx.db
      .query("files")
      .filter((q) =>
        q.and(
          q.eq(q.field("parentId"), undefined),
          q.eq(q.field("name"), DEMO_ORG.name),
        ),
      )
      .first();

    if (existingOrg && !args.force) {
      return { orgId: existingOrg._id, skipped: true };
    }

    const now = Date.now();
    const insertedUsers = new Map<string, Id<"users">>();

    for (const spec of DEMO_USERS) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", spec.email))
        .unique();

      insertedUsers.set(
        spec.email,
        existing?._id ??
          (await ctx.db.insert("users", {
            clerkId: spec.clerkId,
            email: spec.email,
            displayName: spec.displayName,
            createdAt: now,
          })),
      );
    }

    const danaId = insertedUsers.get(DEMO_USERS[0].email)!;
    const samId = insertedUsers.get(DEMO_USERS[1].email)!;

    const orgId = await ctx.db.insert("files", {
      type: "dir",
      name: DEMO_ORG.name,
      parentId: undefined,
      properties: {
        [`org:${DEMO_ORG.slug}`]: `${DEMO_USERS[0].email},${DEMO_USERS[1].email}`,
      },
      forked: false,
      createdAt: now,
      updatedAt: now,
    });

    const roleSpecs = [
      { name: "admin", permissions: ["read", "write", "admin"] },
      { name: "editor", permissions: ["read", "write"] },
      { name: "viewer", permissions: ["read"] },
    ] as const;

    const roleIds = new Map<string, Id<"roles">>();
    for (const spec of roleSpecs) {
      roleIds.set(
        spec.name,
        await ctx.db.insert("roles", {
          orgFileId: orgId,
          name: spec.name,
          permissions: [...spec.permissions],
        }),
      );
    }

    const projectId = await ctx.db.insert("files", {
      type: "dir",
      name: DEMO_ORG.projectName,
      parentId: orgId,
      properties: {
        "role:editor": "write",
        "role:viewer": "read",
      },
      forked: false,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("user_roles", {
      userId: danaId,
      roleId: roleIds.get("admin")!,
    });

    await ctx.db.insert("user_roles", {
      userId: samId,
      roleId: roleIds.get("editor")!,
      projectFileId: projectId,
    });

    return {
      orgId,
      projectId,
      danaId,
      samId,
      skipped: false,
    };
  },
});