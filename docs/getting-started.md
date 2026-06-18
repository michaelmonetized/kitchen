# Getting Started

You do not need to install anything yet. Kitchen has no runtime. This guide builds the **mental model** you need before reading architecture docs or contributing to plans.

## Prerequisites

- Read [The Kitchen Way](./the-kitchen-way.md) or [Introduction](./introduction.md)
- Skim [GLOSSARY.md](../GLOSSARY.md) — you will reuse these terms constantly
- Optional: [Three Modes of Work](./concepts/three-modes-of-work.md) — solo vs fork vs pair

## The six invariants

Memorize these. Every design decision in Kitchen should respect them.

### 1. Files are rows

A TypeScript module, a `package.json`, a PNG, a compiled binary — each is a **File** row in the Sync Store with a MIME type. Directories are File rows with `type: dir`.

There is no server-side filesystem tree. Paths are computed from parent pointers.

### 2. Versions are insert-only

Saving never overwrites. It **inserts** a new Version row. Two users saving concurrently produce two versions with different `_creationTime` values.

There is no `upsert` on versions. Divergence is normal.

### 3. The Mirror is a view

`$HOME/Projects/my-app/src/index.ts` exists on your disk because the **desktop client** wrote it. The Sync Store remains authoritative. Delete your mirror folder and it rebuilds from subscriptions.

### 4. Sync is live

Clients connect via WebSockets. Inserts and metadata changes propagate to every subscribed session. Kitchen is not "save locally, sync later when you remember."

### 5. Merge is human

When versions diverge, Kitchen does not silently pick a winner. A **Pierre Merge** view shows two versions side-by-side. You pick lines. The result is a **new inserted version**.

### 6. Collab is ephemeral until checkpoint

Pair programming uses a **Collab session** on the collab relay. Edits stream as **edit operations** via the **Collab agent** (background service). Only **checkpoints** insert **Versions**. Voice chat is external — Discord, Meet, phone. See [Live Collaboration](./concepts/live-collaboration.md).

## A day in the life (future)

This workflow does not exist in code yet. It describes the target experience.

```
08:00  Open laptop. Kitchen desktop client already synced overnight.
       $HOME/Projects/acme-web/src/app/page.tsx is current.

09:30  Edit page.tsx in Zed. On save, desktop client inserts Version N+1.
       Coworker's machine receives Version N+1 over WebSocket.

10:15  Coworker simultaneously saved Version N+2 from their edit.
       Both versions exist. "Current" pointer flags divergence.

10:20  You open Pierre Merge, pick lines from N+1 and N+2.
       Insert Version N+3. Pointer advances.

11:00  New teammate logs in on Windows. Assigned `viewer` role.
       Projects appear under C:\Users\them\Projects\. Read-only.
```

## Project layout on disk

```
$HOME/Projects/
├── acme-web/          # Project (mirrored dir)
│   ├── src/
│   │   └── page.tsx
│   └── package.json
└── acme-mobile/
    └── ...
```

Project names map to top-level directories under `Projects`. Nested structure mirrors the File parent chain.

## Org and access checklist

Before touching a project in the future app:

1. You are a **User** with a valid session
2. You belong to an **Org** via role assignment
3. Your **Role** grants `read` or `write` on the project's files
4. The **Project** File row exists under that org

Details: [Orgs and Roles](./concepts/orgs-and-roles.md).

## Common misconceptions

**"So it's like GitHub Codespaces?"**
No. Codespaces is a remote dev environment. Kitchen is storage and sync. You use your local editor against a local mirror.

**"So it's like Dropbox for code?"**
Closer. But Dropbox does not version every save as a queryable row or offer Pierre Merge across divergent versions.

**"Can I use git locally on the mirror?"**
You could init git inside a mirror path, but Kitchen does not coordinate with it. Expect confusion. Git compatibility is out of scope for v0.

**"What backend does Kitchen use?"**
Undecided. Convex is the reference (WebSockets, live queries). The Sync Store contract is what matters.

## Exercises (paper only)

Test your understanding without code:

1. Two users insert versions A and B of the same file. How many version rows exist? *(Answer: at least two — A and B — plus whatever was there before.)*
2. A user deletes a file in the mirror. What should the desktop client do? *(Answer: insert a tombstone version or file metadata change upstream — exact policy TBD in architecture docs.)*
3. Where is the org boundary enforced? *(Answer: on File property checks against Role definitions.)*

## Next steps

| If you want to understand… | Read |
|----------------------------|------|
| The schema contract | [Schema](./concepts/schema.md) |
| File rows and version inserts | [Files and Versions](./concepts/files-and-versions.md) |
| Permissions and tenancy | [Orgs and Roles](./concepts/orgs-and-roles.md) |
| Authorization deep dive | [Permissions](./concepts/permissions.md) |
| WebSocket sync and mirror rules | [Sync Model](./concepts/sync-model.md) |
| Git mental model migration | [Git Comparison](./concepts/git-comparison.md) |
| System diagram | [Architecture Overview](./architecture/overview.md) |
| Desktop/mobile/web apps | [Client Overview](./clients/overview.md) |
| Test your recall | [Exercises](./exercises.md) |
| Live pair programming | [Live Collaboration](./concepts/live-collaboration.md), [Collab Agent](./clients/collab-agent.md) |
| Scenario stories | [Concurrent Edit](./guides/concurrent-edit-walkthrough.md), [Pair Programming](./guides/pair-programming-walkthrough.md), [New Teammate](./guides/new-teammate-walkthrough.md) |

Full curriculum: [Documentation README](./README.md).

## Questions

These docs are the curriculum. If anything is unclear, ask — terminology should stay compressed and unambiguous.