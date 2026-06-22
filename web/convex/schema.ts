import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    displayName: v.optional(v.string()),
    username: v.optional(v.string()),
    accountFileId: v.optional(v.id("files")),
    onboardingComplete: v.optional(v.boolean()),
    usernameChangeCount: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_clerk", ["clerkId"])
    .index("by_username", ["username"]),

  username_redirects: defineTable({
    fromUsername: v.string(),
    toUsername: v.string(),
    userId: v.id("users"),
    createdAt: v.number(),
    dropped: v.boolean(),
  })
    .index("by_from", ["fromUsername", "dropped"]),

  file_metadata_events: defineTable({
    fileId: v.id("files"),
    authorUserId: v.id("users"),
    before: v.record(v.string(), v.string()),
    after: v.record(v.string(), v.string()),
    createdAt: v.number(),
  }).index("by_file", ["fileId", "createdAt"]),

  roles: defineTable({
    orgFileId: v.id("files"),
    name: v.string(),
    permissions: v.array(v.string()),
  }).index("by_org", ["orgFileId", "name"]),

  user_roles: defineTable({
    userId: v.id("users"),
    roleId: v.id("roles"),
    projectFileId: v.optional(v.id("files")),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["roleId"]),

  files: defineTable({
    type: v.union(v.literal("dir"), v.literal("file")),
    name: v.string(),
    parentId: v.optional(v.id("files")),
    mime: v.optional(v.string()),
    properties: v.record(v.string(), v.string()),
    currentVersionId: v.optional(v.id("versions")),
    forked: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_parent", ["parentId", "name"])
    .index("by_parent_type", ["parentId", "type"]),

  versions: defineTable({
    fileId: v.id("files"),
    content: v.bytes(),
    authorUserId: v.id("users"),
    parentVersionIds: v.optional(v.array(v.id("versions"))),
  }).index("by_file", ["fileId"]),
});