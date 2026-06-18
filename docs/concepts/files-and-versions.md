# Files and Versions

Kitchen stores everything as **File** rows. Content changes create **Version** rows. This page explains that pair — the heart of the system.

## File rows

A File is a Sync Store record with at minimum:

| Field | Purpose |
|-------|---------|
| `id` | Stable identifier |
| `type` | `dir` or `file` |
| `name` | Path segment (e.g. `index.ts`, `src`) |
| `parent` | Parent `dir` file id (null for org roots) |
| `mime` | MIME type for leaf files |
| `properties` | Metadata map (permissions, tags) |

### Directories

`type: dir` files form the tree:

- **Org** — `dir`, no parent
- **Project** — `dir`, parent is org
- **Folder** — `dir`, parent is project or folder

### Leaf files

`type: file` rows hold content indirectly — through versions. The File row is the identity; versions carry bytes.

### MIME types

Every leaf file has a MIME type:

| Content | Example MIME |
|---------|--------------|
| TypeScript | `text/typescript` |
| JSON | `application/json` |
| PNG | `image/png` |
| Build artifact | `application/octet-stream` |

Binary and text share the same model. Binaries are stored as column bytes (or chunked columns) in the version payload — no separate blob service required for v0.

## Version rows

A Version captures content at one instant:

| Field | Purpose |
|-------|---------|
| `id` | Version identifier |
| `fileId` | Parent file |
| `content` | Text or binary payload |
| `_creationTime` | Ordering key (system-generated) |

### Insert-only rule

**There is no upsert.** `save()` always `insert()`. This is non-negotiable.

Rationale from the source concept:

- History is free — every save is preserved
- Concurrent editors never block each other at the storage layer
- "Current" is a policy decision, not a destructive write

### Current pointer

Each file maintains a **current version pointer** — which version the mirror and UI treat as active. Pointer updates happen when:

- A new version is inserted and no divergence exists
- A human completes Pierre Merge and inserts a merged version
- An admin explicitly pins a historical version (future)

When pointers diverge across clients, the UI surfaces **version fork** state.

## Concurrent edits

```
Time →
User A:  v1 ──insert──► v3
User B:  v1 ──insert──► v4

Result: v1, v3, v4 all exist. Current pointer unresolved until merge.
```

Kitchen does not use file locks. Last-writer-wins is forbidden at the version layer.

## Text vs binary

| Aspect | Text | Binary |
|--------|------|--------|
| Storage | Version `content` column | Same column, byte array |
| Diff | Line-oriented Pierre diff | Byte or block diff (TBD) |
| Mirror write | UTF-8 to local path | Raw bytes |

Large binaries may need chunked versions in a future plan. v0 docs assume single-column storage with size limits enforced by the Sync Store.

## Path resolution

Logical paths are computed by walking parent pointers:

```
Org "acme" (dir, parent: null)
 └── Project "web" (dir)
      └── Folder "src" (dir)
           └── File "index.ts" (file, mime: text/typescript)
```

Mirror path: `$HOME/Projects/web/src/index.ts`

Project segment uses project **name**, not org name, in the default layout. Org-scoped layouts are a future configuration option.

## What is not a File

- **Users** — separate entity
- **Roles** — separate entity (definitions in role table; references on files)
- **Versions** — children of files, not standalone tree nodes in the mirror

## Related

- [Versioning](../architecture/versioning.md) — pointer policy and merge flow
- [Sync Model](./sync-model.md) — how inserts propagate
- [Git Comparison](./git-comparison.md) — if you are coming from git
- [Pierre Integration](../reference/pierre-integration.md) — line-picking merge UI