# Schema

Kitchen's **schema** is the contract between the Sync Store and every client. Three top-level entities — users, roles, files — plus an append-only **versions** log per file. This page is the implementation reference; narrative context lives in [Data Model](../architecture/data-model.md).

## Design rules

1. **Three entities, one log** — users, roles, files are first-class tables. Versions hang off files only.
2. **Insert-only versions** — no `UPDATE` on `versions.content`. Ever.
3. **Orgs and projects are files** — `type: dir` with parent constraints, not separate tables.
4. **Properties are strings** — ACL on files uses `org:*` and `role:*` property keys (v0).
5. **Backend-agnostic** — Convex schema below is the reference implementation, not a lock-in.

## Entity diagram

```
users ──────────────┐
                    ├──► user_roles ◄──── roles
                    │         │
files ◄─────────────┘         └── scoped to org (+ optional project)
  │
  ├── currentVersionId ──► versions (latest pointer)
  └── versions[] (1:N history, insert-only)
```

## Tables

### `users`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | Id | auto | Primary key |
| `email` | string | yes | Unique index |
| `displayName` | string | no | |
| `createdAt` | number | yes | Unix ms |

### `roles`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | Id | auto | |
| `orgFileId` | Id\<"files"\> | yes | Must reference org root (`parentId: null`) |
| `name` | string | yes | Unique per org, e.g. `editor` |
| `permissions` | string[] | yes | `read`, `write`, `admin` |

### `user_roles`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | Id | auto | |
| `userId` | Id\<"users"\> | yes | |
| `roleId` | Id\<"roles"\> | yes | |
| `projectFileId` | Id\<"files"\> | no | Null = org-wide assignment |

### `files`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | Id | auto | |
| `type` | `"dir"` \| `"file"` | yes | |
| `name` | string | yes | Path segment; unique among siblings |
| `parentId` | Id\<"files"\> | no | Null **only** for org roots |
| `mime` | string | if `file` | e.g. `text/typescript` |
| `properties` | object | yes | ACL + metadata map |
| `currentVersionId` | Id\<"versions"\> | no | Active version pointer |
| `forked` | boolean | yes | True when multiple version heads exist |
| `createdAt` | number | yes | |
| `updatedAt` | number | yes | Metadata only |

**Parent invariants** (enforced in mutations):

| Kind | `parentId` |
|------|------------|
| Org | `null` |
| Project | org file id |
| Folder / file | project or folder id |

### `versions`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | Id | auto | |
| `fileId` | Id\<"files"\> | yes | |
| `content` | bytes | yes | Text UTF-8 or raw binary |
| `authorUserId` | Id\<"users"\> | yes | |
| `parentVersionIds` | Id\<"versions"\>[] | no | Set on merge inserts |
| `_creationTime` | number | auto | System ordering key |

No `updatedAt`. Rows are immutable after insert.

## Property schema (v0)

Keys on `files.properties`:

| Key pattern | Value | Meaning |
|-------------|-------|---------|
| `org:<slug>` | comma-separated emails | Membership display metadata |
| `role:<name>` | `"read"` \| `"write"` | Grant to holders of `<name>` |

Example:

```json
{
  "org:acme-corp": "alice@example.com,bob@example.com",
  "role:editor": "write",
  "role:viewer": "read"
}
```

## Convex reference schema

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    displayName: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

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
```

## API surface (mutations)

Insert-only where it matters:

| Mutation | Behavior |
|----------|----------|
| `users.upsert` | Auth onboarding only |
| `roles.insert` | Org admin creates role |
| `user_roles.insert` | Assign user to role |
| `files.insert` | Create org, project, folder, or file row |
| `files.updateMetadata` | Rename, move, property change — **not** content |
| `versions.insert` | **Only** way to change file bytes |
| `files.setCurrentVersion` | Advance pointer after linear insert or merge |

Forbidden:

- `versions.update`
- `versions.delete` (v0 — retention policy deferred)
- `files.updateContent` (content lives in versions only)

## API surface (queries / subscriptions)

| Query | Returns |
|-------|---------|
| `files.children(parentId)` | Direct child files for tree UI |
| `files.resolvePath(projectId, path)` | File id from logical path |
| `versions.list(fileId, limit)` | History newest-first |
| `versions.get(id)` | Single version payload |
| `projects.forUser(userId)` | Authorized project roots |

Subscriptions (WebSocket):

| Event | Trigger |
|-------|---------|
| `file.insert` | New file row |
| `file.metadata` | Rename, move, property change |
| `version.insert` | New version row |
| `file.pointer` | `currentVersionId` or `forked` change |

Subscriptions (collab channel — separate namespace):

| Event | Trigger |
|-------|---------|
| `session.*` | Collab relay session lifecycle |
| `op.apply` | Edit operation broadcast |
| `presence.update` | Cursor/selection broadcast |
| `checkpoint.complete` | After `versions.insert` from session |

## Collab API (ephemeral — not tables)

**No `collab_sessions` table.** Relay storage is implementation-specific.

| Call | Behavior |
|------|----------|
| `collab.startSession(fileId)` | Returns sessionId; validates write |
| `collab.joinSession(sessionId)` | Adds participant |
| `collab.leaveSession(sessionId)` | Removes participant; may checkpoint |
| `collab.applyOp(sessionId, op)` | Broadcast; relay orders |
| `collab.updatePresence(sessionId, presence)` | Broadcast only |
| `collab.checkpoint(sessionId)` | `versions.insert` + continue or end |

## Authorization in mutations

Every `versions.insert` and `files.insert`:

```
1. Resolve file + ancestor chain
2. Load user_roles for session user scoped to org
3. Merge properties from file → root
4. Deny if no matching role:<name>:write
5. Insert row
6. Update pointer / forked flag
7. Broadcast subscription event
```

## Size and binary handling

| Constraint | v0 policy |
|------------|-----------|
| Max version size | 50 MB soft cap per row |
| Text encoding | UTF-8 in `content` bytes |
| Binary | Same column; `mime` on parent file |
| Chunked large files | Out of scope — future `version_chunks` table |

## Indexes rationale

| Index | Query it serves |
|-------|-----------------|
| `files.by_parent` | Tree navigation, path uniqueness |
| `versions.by_file` | History + subscription replay |
| `user_roles.by_user` | Session auth on every mutation |
| `roles.by_org` | Admin UI role list |

## Drift from git mental model

| Git concept | Schema equivalent |
|-------------|-------------------|
| Repository | Project file row + subtree |
| `HEAD` | `files.currentVersionId` |
| Commit | `versions` row |
| Branch | Parallel version heads + `forked: true` |
| Merge commit | `versions.insert` with `parentVersionIds: [a, b]` |

## Related

- [Data Model](../architecture/data-model.md) — narrative ER description
- [Files and Versions](./files-and-versions.md) — file/version semantics
- [Sync Model](./sync-model.md) — subscription events on schema changes
- [Versioning](../architecture/versioning.md) — pointer and fork policy