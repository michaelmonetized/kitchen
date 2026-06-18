# Permissions

Kitchen authorization is **property-based on File rows**, backed by a **role table** per org. There is no separate ACL service. This page explains how access decisions are made.

## Three layers

```
User ──assigned via──► user_roles ──references──► Role (org-scoped)
                                                      │
File.properties ◄─────────────────────────────────────┘
  "role:editor": "write"
```

1. **Role definitions** — what a named role can do (`read`, `write`, `admin`)
2. **User assignment** — which users hold which roles (optionally scoped to a project)
3. **File properties** — which roles may read or write each file (or subtree)

## Role table

Each org maintains roles:

| Role | Typical permissions |
|------|---------------------|
| `admin` | `read`, `write`, `admin` |
| `editor` | `read`, `write` |
| `viewer` | `read` |

Role names are **org-scoped**. `editor` in Org A is unrelated to `editor` in Org B.

## User assignment

`user_roles` links users to roles:

| Field | Effect |
|-------|--------|
| `userId` | Who |
| `roleId` | Which role |
| `projectFileId` (optional) | Limit role to one project; null = org-wide |

Example: Alice has `editor` on Project "acme-web" only. She cannot write files in "acme-mobile".

## File properties (ACL)

Properties live on `files.properties` as string key-value pairs. See [Property Syntax](../reference/property-syntax.md) for the full cheat sheet.

```json
{
  "org:acme-corp": "alice@example.com,bob@example.com",
  "role:editor": "write",
  "role:viewer": "read"
}
```

| Key | Value | Grants |
|-----|-------|--------|
| `org:<slug>` | emails | Display metadata — not the security boundary |
| `role:<name>` | `"read"` | Holders of `<name>` may read |
| `role:<name>` | `"write"` | Holders of `<name>` may insert versions |

**Shorthand notation** in prose: `role:editor:write` means key `role:editor` with value `write`.

## Authorization algorithm

Every `versions.insert` and `files.insert` runs server-side:

```
1. Resolve target file
2. Walk ancestor chain to org root
3. Merge properties: child overrides parent (inheritance — v0 default)
4. Load user_roles for session user in this org
5. For write: require matching role:<name> = "write" AND user holds <name>
6. For read: require matching role:<name> = "read" OR "write"
7. Deny if no match — client UI hiding is not security
```

Pseudocode from [Data Model](../architecture/data-model.md):

```
function canWrite(user, file):
  roles = user_roles for user scoped to file's org
  props = mergeProperties(file, ancestors)
  for (key, value) in props:
    if key starts with "role:" and value == "write":
      roleName = key after "role:"
      if user has roleName in roles:
        return true
  return false
```

## Inheritance

Default policy (v0): child files **inherit** parent properties unless overridden.

```
Project "acme-web"     properties: { "role:editor": "write", "role:viewer": "read" }
 └── src/              (inherits)
      └── index.ts     (inherits — editors may write)
```

Override on a sensitive file:

```json
{ "role:editor": "read", "role:admin": "write" }
```

Only admins write this file; editors read only.

Exact merge order (child wins on key collision) is implementation detail. Semantics: **most specific file wins**.

## Org owner capabilities

Org creators become owners with implicit admin until transfer. Owners can:

- Create roles
- Assign users
- Transfer project ownership to another user or org
- Set properties on org and project roots

Ownership transfer is a metadata mutation on File rows — not a version insert.

## What permissions do not control (v0)

| Concern | Where it lives |
|---------|----------------|
| Billing | Future — org file metadata |
| API rate limits | Sync Store edge |
| Mirror path layout | Desktop client config |

## Failure modes

| Situation | Server | Client |
|-----------|--------|--------|
| Role revoked mid-session | Deny next insert | Grey out editor, show "access revoked" |
| User has role but file lacks property | Deny | Hide write UI if server says read-only |
| User has write on parent, not child override | Allow | Normal edit |

## Comparison to git hosting permissions

| GitHub | Kitchen |
|--------|---------|
| Org member | User with user_roles entry |
| Team `push` permission | `role:editor` + `role:editor: write` property |
| Repo read for outsiders | `role:viewer: read` on project root |
| CODEOWNERS | File-level property overrides (manual) |

## Related

- [Orgs and Roles](./orgs-and-roles.md)
- [Property Syntax](../reference/property-syntax.md)
- [Schema](./schema.md) — `user_roles` table
- [New Teammate Walkthrough](../guides/new-teammate-walkthrough.md)