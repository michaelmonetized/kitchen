# Public ACL — FOSS tier with per-file overrides

Projects have scope on the project `dir` row ([ADR 0010](./0010-project-ownership-and-scope.md)): **`user`** (default), **`org`**, **`public`**. This ADR covers **`public`** scope only.

A project elevated to **`public`** (`role:public: read`) is **FOSS-shaped**: anonymous visitors get tree + file content + full version history — same transparency as a public GitHub repo.

Per-file ACL **overrides parent all the way down the tree**. A child can revoke public access even when the project root is public. Public viewers **do not see** denied paths in the tree (not merely redacted content).

## Grant

```json
{ "role:public": "read" }
```

| Value | Meaning |
|-------|---------|
| `"read"` | Anonymous may read tree entry, bytes, and version history for this node (if effective after merge) |
| `"deny"` | **Revoke** inherited public access on this node (child override) |
| `"write"` | Not supported for `public` |

## Inheritance + override

Walk ancestor chain root → leaf; **child wins per key**. Inherited `role:public: read` applies until a descendant sets `role:public: deny` or restricts roles on that file.

## Example — `flakebed` (public FOSS) with secret `.env`

Project root:

```json
{ "role:public": "read", "role:editor": "write", "role:viewer": "read" }
```

`.env` (contributor-only — overrides public):

```json
{ "role:public": "deny", "role:editor": "write" }
```

**Public viewer experience:**

- Sees `flakebed/` tree: `src/`, `README.md`, …
- **Does not see** `.env` — omitted from `listProjectTree` / `children` for anonymous sessions
- Authenticated editor sees `.env` normally

## Server

- `canReadAnonymous(fileId)` — true iff merged properties include `role:public: read` and not `deny` on this node
- Tree queries for anonymous users **filter out** nodes failing `canReadAnonymous` (no ghost entries)
- Authenticated users use normal `canRead` with their roles

## CLI

`npx kitchen changes .env` without auth on public project → **FORBIDDEN** (path not visible). `npx kitchen changes README.md` → full history JSON.

## Use cases

- FOSS / portfolio / hiring showcase (full public history)
- Org discovery (which public projects exist)
- **Not** CI version history ([ADR 0008](./0008-cli-auth-fail-closed.md))

## Consequences

Task [`023-public-acl.md`](../../tasks/023-public-acl.md) — `canReadAnonymous`, tree filtering, `role:public: deny`, web public browse.