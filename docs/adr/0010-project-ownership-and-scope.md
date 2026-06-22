# Project ownership, account email, and scope

**Account = your email** (Clerk identity). You create an account, run the daemon (or `npx kitchen auth`); Clerk session → JWT on every Convex call. In the cloud, projects parent to an **account row keyed by that email** (`parentId` immutable). On disk, the mirror is flat: **anything directly in `~/Projects` is a project**, pushed with **`owner: <your email>`**.

## Mirror contract (Q15 = D)

```
$HOME/Projects/
├── flakebed/          ← project (dir)
├── michael-notes/     ← project (dir)
└── sketch.ts          ← project (single top-level file — optional)
```

- **Top-level** entry in `~/Projects` = one project root (folder or file).
- Daemon watches only this level for new project roots (+ tree inside each).
- On push/create: `properties.owner` = authenticated session email (from Clerk JWT).
- Nested paths inside a project are normal files/folders — not separate projects.

## Cloud row model

```
Account (dir) — identity = user email (unique)
 └── Project (dir or file) — parentId = account id (never changes)
      └── src/ …
```

| Field / rule | Meaning |
|--------------|---------|
| **Account** | One row per email; created on first login |
| **Project `parentId`** | Account file id at create — **immutable** through scope elevation |
| **`owner` property** | Originating email; set from JWT on create/sync; **transferrable** via mutation |
| **Org / public** | `org:<name>` and `role:*` patches on project row — not `parentId` |

Auth: daemon (`kitchen-mirror start`) and CLI (`npx kitchen auth`) share `~/.kitchen/auth.json` → Clerk JWT.

## Scope (Q13–Q14)

| Scope | Typical properties |
|-------|-------------------|
| **`user`** (default) | `{ "owner": "you@email.com", "role:user": "write" }` |
| **`org`** | + `"org:acme-corp": "…"`, `"role:org": "write"`, owner keeps `"role:user": "read"` |
| **`public`** (FOSS) | + `"role:public": "read"` |

**Elevate private → org:** add `org:<name>` string; change write from `user` → `org`. `parentId` unchanged.

## FOSS fork + audit

- **Fork** public project → new top-level `~/Projects/<name>/` under your account ([ADR 0011](./0011-foss-fork-no-pr.md)).
- **Scope/owner changes** audited forever ([ADR 0012](./0012-metadata-audit-trail.md)).

## URLs (Q16 = A)

Project names collide across accounts — fine. Share links: `/<username>/<project>` ([ADR 0013](./0013-project-namespace-and-urls.md)) — e.g. `mostlyalice/flakebed` vs `bobactually/flakebed`.

## Consequences

- Task [`024-account-parent-projects.md`](../../tasks/024-account-parent-projects.md)
- Mirror client: top-level `~/Projects` scanner; owner from JWT