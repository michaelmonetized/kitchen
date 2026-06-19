# Kitchen — agent notes (this project)

This project uses **Kitchen**, not git, for version history.

## Model (30 seconds)

- **Files** = rows in Convex (`files` table). This directory tree is a **mirror** at `$HOME/Projects/`.
- **Versions** = insert-only content rows (`versions` table). Every save appends; no `git commit`.
- **No git** = no `add` / `commit` / `push` / `pull` / `rebase`. History is queryable by path.
- **Auth** = mirror daemon uses `~/.kitchen/mirror-auth.json` (Clerk session). Same user as the developer.
- **ACL** = `role:*` properties on file rows; enforced server-side.
- **Offline** = Notion-on-phone: save locally, queue inserts, flush on reconnect; conflicts → fork → merge in web.

## Typical prompt (no extra context needed)

> Tell me how `src/index.ts` has changed over the last 10 edits.

Run:

```bash
npx kitchen changes src/index.ts --limit 10
```

With a time bound (`--since` accepts Temporal-compatible ISO 8601 instants):

```bash
npx kitchen changes src/index.ts --since 2026-06-01T00:00:00Z
```

No Kitchen-specific skill — you already know CLI + VCS-shaped history.

## Fallback (raw Convex)

```bash
npx convex run queries:listVersions --args '{"fileId": "<files id>", "limit": 10}'
```

Resolve `fileId` via `queries:listProjectTree` if needed.

Humans may also use the Kitchen web app: tree → file → history / Pierre diff.

## Forks

Concurrent saves create multiple version heads (`forked: true`). Merge is human line-pick in web — not auto-merge.

## Deletes

`properties.deleted = "true"` tombstones files; rows and versions are retained.

## More

- ADR 0005 (no product AI), ADR 0007 (`kitchen changes`)
- Kitchen is a codename.