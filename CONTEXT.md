# Kitchen — Shared Domain Language

This document is the canonical vocabulary for Kitchen. All docs, issues, and code should use these terms. See [[GLOSSARY.md]] for tight definitions.

## What Kitchen is

Kitchen is a cloud-native project store. **Files are database rows**, not filesystem objects. Your machine sees a familiar tree at `$HOME/Projects`, but that tree is a **mirror** of the Sync Store — maintained in realtime over WebSockets.

There is no git. No commits, branches, pull requests, or merges in the traditional sense. Every change creates a new **Version** row. Collaboration is live sync plus human-driven **Pierre Merge** when versions diverge.

## Top-level architecture

Kitchen deliberately limits itself to three concerns:

| Entity | Responsibility |
|--------|----------------|
| **User** | Identity, authentication, org membership |
| **Role** | Named permission bundles scoped to an org or project |
| **File** | Every piece of content — source text, directories, binaries |

Nothing else is a first-class entity. Orgs and projects are **files of type `dir`** with specific parent rules.

## Entity hierarchy

```
User
 └── belongs to → Org (via Role assignment)

File (type: dir, no parent)     → Org root
 └── File (type: dir, org parent) → Project root
      └── File (type: file | dir) → Project contents
           └── Version (append-only rows per file)
```

### Org

An org is a `dir` file with **no parent**. It is the tenancy boundary for roles, billing (future), and member access.

### Project

A project is a `dir` file whose **only parent** is an org. All code, assets, and nested directories live under a project root.

### File

A file row represents either:

- **`dir`** — a directory (org, project, or nested folder)
- **`file`** — a leaf: source code, config, image, compiled binary, any mime type

Every file carries:

- `mime` — MIME type (e.g. `text/typescript`, `application/octet-stream`)
- `name` — display name / path segment
- `parent` — reference to parent `dir` file (except org roots)
- Properties — key-value metadata (permissions, org tags, etc.)

### Version

Versions are **append-only rows** tied to a file. There is no upsert. Saving always inserts. Concurrent editors produce parallel version rows distinguished by `_creationTime`.

The "current" version of a file is a **pointer** (latest by policy, or explicitly selected after merge) — not an overwrite.

## Permission model

Permissions attach to files as properties, not as separate ACL tables.

```
org:acme|[alice,bob]          # org membership hint on a file
role:editor:write             # role grants write
role:viewer:read              # role grants read
```

Org owners and admins:

- Create roles within orgs and projects they control
- Assign users to roles
- Transfer ownership to any user or org

Role definitions live in a **role table** scoped to the org. Files reference roles by name in their property set.

## Sync Store

The Sync Store is the authoritative cloud backend. It:

- Persists users, roles, files, and versions
- Pushes mutations to all connected clients via WebSockets
- Accepts inserts from any authorized client

The backend technology is **not prescribed**. Convex is a reference implementation (live queries, WebSockets). Kitchen's contract is behavioral: realtime, mutable, insert-only versions.

## Mirror

The Mirror is the local filesystem projection at `$HOME/Projects`. Desktop clients:

1. Subscribe to project file trees via WebSocket
2. Write incoming versions to the local path
3. Watch local changes and insert new versions upstream

The mirror is a **view**, not the source of truth.

## Pierre Merge

When two versions of the same file exist, Kitchen does not auto-merge. A **Pierre diff view** lets a human pick lines from two versions side-by-side and insert a new merged version.

Kitchen should use Pierre diff and tree primitives where possible. Fork only if first-principles constraints require it.

## Live collaboration

**Live sync** propagates durable changes — checkpoints and solo saves — to all clients over WebSockets within seconds. **Live collab** is different: multiple users edit one file in a shared ephemeral session with sub-operation latency until a checkpoint inserts a **Version**.

- **Collab session** — ephemeral room on one **File**; participants need `write` via org **Role**, not a separate collab permission entity.
- **Checkpoint rule** — only `versions.insert` durably changes file bytes; session ops are ephemeral until checkpoint.
- **Editor-agnostic pair (v0)** — each machine runs a **Collab agent** that watches the mirror file. Teammate A uses Neovim; teammate B uses VS Code — no Kitchen plugins required; autowrite/autosave recommended for low latency.
- **Communication out of scope** — voice, video, and text chat (Meet, Discord, phone) are external; Kitchen syncs file bytes only.
- **Optional Collab adapters** — plugins add in-editor cursors later; they are not the pairing mechanism.
- **Fork compatibility** — external save during active session → session goes stale or ends; **Pierre Merge** still resolves multi-head.
- **Not a fourth entity** — sessions live in collab relay memory; implementation detail, not a `files` table.

## Explicit non-goals (v0)

- Git compatibility or import/export as a primary workflow
- Automatic three-way merge without human line selection
- Branching and release trains
- Commit messages and signed commits
- Built-in voice, video, or text chat
- Terminal sharing (shared live shell) — each dev runs their own terminal
- Required per-editor plugins for pair programming — v0 uses **Collab agent** only