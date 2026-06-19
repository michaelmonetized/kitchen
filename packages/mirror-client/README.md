# @kitchen/mirror-client

Headless TypeScript daemon that bidirectionally syncs the Kitchen Convex Sync Store with a local mirror at `$HOME/Projects/<project>/`.

## Install

From the Kitchen repo root:

```bash
npm install
npm run build -w @kitchen/mirror-client
```

## Environment

Pull the same Clerk + Convex keys as the web app:

```bash
bash scripts/setup-env.sh
# or: cd web && clerk env pull --file .env.local
```

Required variables (export from `web/.env.local` or your shell):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Browser sign-in during `login` |
| `CLERK_SECRET_KEY` | Mint Convex JWT from saved Clerk session |

Optional:

| Variable | Default |
|----------|---------|
| `KITCHEN_MIRROR_ROOT` | `$HOME/Projects` |

## Auth & token strategy

1. **`kitchen-mirror login`** opens a browser sign-in page on `127.0.0.1`, mounts Clerk, and POSTs the resulting **Clerk session ID** to `~/.kitchen/mirror-auth.json`.
2. **`kitchen-mirror start`** loads that session ID on every run (survives daemon restart).
3. The daemon uses **`CLERK_SECRET_KEY`** + `@clerk/backend` `sessions.getToken(sessionId, "convex")` to mint a short-lived Convex JWT, refreshed every ~50 minutes.

The persisted artifact is the **Clerk session ID**, not the JWT. JWTs expire quickly; the session ID is stable until sign-out or expiry.

## Mirror root

Each authorized project becomes a top-level directory:

```
$HOME/Projects/
├── acme-corp-my-app/
│   ├── .kitchen/
│   │   ├── convex.json          # deployment URL pointer (create-if-missing)
│   │   └── docs/
│   │       └── AGENTS.md        # agent discovery kit (create-if-missing)
│   └── src/
│       └── index.ts
```

Slugs are `{orgSlug}-{projectSlug}` to avoid collisions across orgs.

## Agent discovery kit (`.kitchen/docs`)

On first project materialization, the daemon writes **create-if-missing** files so external harnesses discover Kitchen without product AI:

| Path | Purpose |
|------|---------|
| `.kitchen/docs/AGENTS.md` | 30-second model: no git, insert-only `versions`, `npx kitchen changes`, `npx kitchen auth` → `~/.kitchen/auth.json`, `role:public`, offline queue |
| `.kitchen/convex.json` | `{ "deploymentUrl": "<NEXT_PUBLIC_CONVEX_URL>" }` for `npx convex` |

Templates live in `packages/mirror-client/templates/`. User edits to `AGENTS.md` are **never overwritten** on later syncs.

Verify after a mirror sync:

```bash
ls $HOME/Projects/<project>/.kitchen/docs/AGENTS.md
npm run verify:agent-discovery -w @kitchen/mirror-client
```

See [`docs/clients/agent-discovery.md`](../../docs/clients/agent-discovery.md).

## Dev workflow

```bash
# Terminal A — web + Convex
cd web && npx convex dev &
npm run dev:web

# Terminal B — one-time login
export $(grep -v '^#' web/.env.local | xargs)
npm run login -w @kitchen/mirror-client

# Terminal B — mirror daemon
npm run dev:mirror
```

Edit a mirrored file in your local editor → Convex `versions.insert` → web UI updates.  
Edit in the web app → Convex subscription → local file updates (echo-suppressed ~500ms).

## Fork policy A (grill)

When `file.forked` is true, disk holds one byte stream but Convex may have multiple version heads:

| Direction | Behavior |
|-----------|----------|
| **Cloud → disk** | Writes bytes only for versions where `authorUserId` matches this daemon's session user. Remote users' inserts are **skipped** (local bytes frozen). |
| **Disk → cloud** | Still allowed — local saves insert new heads as usual. |
| **Notify** | macOS notification + deep link to web merge UI (`/app/projects/.../files/.../merge`). |

After merge inserts a single composed version, `forked` clears and normal sync resumes.

## Tree diff (moves)

The daemon keeps a `fileId ↔ mirror path` map per project:

| Direction | Behavior |
|-----------|----------|
| **Cloud → disk** | `parentId` / `name` change → `fs.rename` / `mkdir` (echo-suppressed). |
| **Disk → cloud** | Local `mv` → `files.updateMetadata`; local `mkdir` → `files.insert` (`type: dir`). |

## Soft delete

| Direction | Behavior |
|-----------|----------|
| **Disk → cloud** | Local `rm` (after rename window) → `files.markDeleted` (`properties.deleted = "true"`). |
| **Cloud → disk** | Tombstone removes path from live tree subscription → `unlink` on disk. |
| **History** | Version rows remain queryable by `fileId` for audit. |

Tree queries (`children`, `listProjectTree`) and mirror subscriptions skip `deleted === "true"`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev -w @kitchen/mirror-client` | Watch mode (`tsx watch`) |
| `npm run start -w @kitchen/mirror-client` | Run built daemon |
| `npm run login -w @kitchen/mirror-client` | Browser OAuth login |
| `npm run build -w @kitchen/mirror-client` | TypeScript compile |

## Echo suppression

Cloud→disk writes mark the path for ~500ms so `@parcel/watcher` does not immediately call `versions.insert` again. See [`docs/clients/desktop-sync.md`](../../docs/clients/desktop-sync.md).