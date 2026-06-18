# Data Model

Kitchen's persistence layer centers on three entities. Versions are a subordinate append-only log per file — not a fourth top-level entity.

## Entity relationship

```
users ──────┐
            ├──► user_roles ◄──── roles (scoped to org)
            │
files ◄─────┘
  │
  └── versions (1:N, insert-only)
```

## users

| Column | Type | Notes |
|--------|------|-------|
| `id` | id | Primary key |
| `email` | string | Unique |
| `displayName` | string | Optional |
| `createdAt` | timestamp | |

Users authenticate via standard session or OAuth. Auth provider is implementation-specific.

## roles

Roles are defined per org.

| Column | Type | Notes |
|--------|------|-------|
| `id` | id | Primary key |
| `orgFileId` | id | FK → files (org root) |
| `name` | string | e.g. `editor`, unique per org |
| `permissions` | string[] | e.g. `read`, `write`, `admin` |

## user_roles

| Column | Type | Notes |
|--------|------|-------|
| `userId` | id | FK → users |
| `roleId` | id | FK → roles |
| `projectFileId` | id? | Optional scope to one project |

Null `projectFileId` means org-wide role assignment.

## files

| Column | Type | Notes |
|--------|------|-------|
| `id` | id | Primary key |
| `type` | enum | `dir` \| `file` |
| `name` | string | Path segment |
| `parentId` | id? | Null only for org roots |
| `mime` | string? | Required for `type: file` |
| `properties` | json | Permission strings, metadata |
| `currentVersionId` | id? | Pointer to active version |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | Metadata only — content changes touch versions |

### Parent rules (enforced)

| File kind | `parentId` |
|-----------|------------|
| Org | `null` |
| Project | org file id |
| Folder / file | project or folder file id |

### Property examples

```json
{
  "org:acme-corp": "alice@example.com,bob@example.com",
  "role:editor": "write",
  "role:viewer": "read"
}
```

Property syntax is stringly-typed in v0 for simplicity. Structured ACL objects are a future migration if needed.

## versions

| Column | Type | Notes |
|--------|------|-------|
| `id` | id | Primary key |
| `fileId` | id | FK → files |
| `content` | bytes / text | Payload |
| `createdAt` | timestamp | Immutable ordering |
| `authorUserId` | id | Who inserted |

**No `updatedAt`.** Versions are immutable.

**No upsert endpoint.** API exposes `versions.insert` only.

### Size limits

v0 assumes single-row content storage. Implementation should enforce max size per version (TBD — suggest 50MB soft limit with chunked version plan for larger artifacts).

## Indexes (recommended)

| Index | Purpose |
|-------|---------|
| `files(parentId, name)` | Path resolution, uniqueness among siblings |
| `versions(fileId, createdAt DESC)` | History listing, current candidate |
| `user_roles(userId)` | Session authorization |
| `roles(orgFileId)` | Org admin UI |

## Authorization check (pseudocode)

```
function canWrite(user, file):
  roles = user_roles for user scoped to file's org
  for prop in file.properties merged with ancestor chain:
    if prop matches role:name:write and user has role:
      return true
  return false
```

Server enforces on every `versions.insert` and `files.insert`.

## Convex mapping (reference)

If implemented on Convex:

- `users`, `roles`, `userRoles`, `files`, `versions` tables
- `versions.insert` mutation triggers subscription updates
- Files use Convex `v.id()` references

This mapping is illustrative, not mandatory.

## Related

- [Schema](../concepts/schema.md) — implementation contract (Convex validators, API surface)
- [Files and Versions](../concepts/files-and-versions.md)
- [Orgs and Roles](../concepts/orgs-and-roles.md)
- [Versioning](./versioning.md)