# Messaging Core

Copy-paste kernel for every platform. Do not drift from these lines.

## One-liner (canonical)

> **Your projects live in the cloud. Your editor sees them on disk. There is no git.**

## "No git" — expanded (use when challenged or in maker/first comment)

> **"No git"** means mutations are just tracked — every save inserts a version row and live-syncs. You never spend another brain cell on `git add`, `commit`, `push`, `pull`, or `rebase`. History and merge stay; the ceremony goes.

**Short variant (PH maker comment, HN footnote):**

> No git ≠ no history. No git = no add/commit/push/pull/rebase loop. Saves are tracked automatically.

## VCS-first framing (HN / technical audiences)

> Kitchen is version control with ACL first — insert-only versions, per-version blame, Pierre review when you want ceremony. You edit in your local editor on `$HOME/Projects`; web is tree + diff + blame + rollback + ACL, not a textarea. Collab is the point; cloud storage is the mirror side effect.

## Web vs mirror (do not confuse)

| Write code | Review / admin |
|------------|----------------|
| Mirror + VS Code / nvim / Zed | Web: tree, Pierre splits, blame, history, merge, roles |

**Never claim:** "edit in the browser" as primary path.

## Sub-lines (pick one per post)

- Cloud holds truth. Disk is a mirror. Save inserts history. Sync is always on.
- Stop stacking editor → disk → git → remote. Kitchen collapses storage, sync, work, and collaboration into one model.
- Like Google Drive for code — except every save is versioned and live-synced to every machine you're logged into.

## Codename disclaimer

> Kitchen is a working codename, not the final product name.

## Four layers (table)

| Layer | Kitchen | You experience |
|-------|---------|------------------|
| **Storage** | Files are DB rows; versions are insert-only | History without `git commit` |
| **Sync** | WebSocket push | Save → peers see it in seconds |
| **Work** | Mirror at `$HOME/Projects` | Your normal editor and terminal |
| **Collaboration** | Live collab + Pierre merge | Pair in any editor; merge by line-pick |

## Three modes

| Mode | When | Mechanism |
|------|------|-----------|
| **Solo sync** | Default workday | Save anywhere → live fan-out |
| **Fork + merge** | Concurrent edits diverge | Pierre line-pick → new version |
| **Live pair** | Realtime session | Collab agent per machine; voice on Discord |

## Granular ACL (team / B2B beat)

Permissions live **on file rows**, not in a separate ACL service:

- **Org-scoped roles** — `admin`, `editor`, `viewer` (org defines names)
- **Project-scoped assignment** — give Alice `editor` on `acme-web` only, not every project
- **Property-based grants** — `role:editor:write` and `role:viewer:read` on files and folders; child overrides parent (inherit down the tree)
- **Server-enforced** — every read and `versions.insert` walks the ancestor chain; UI hiding is not security

**One-liner for team posts:**

> Role-based access on every file and folder — scoped per project, inherited down the tree, enforced on every save.

**Shorthand example:**

```json
{ "role:editor": "write", "role:viewer": "read" }
```

## Proof points

- **Live:** [kitchen-gilt-nine.vercel.app](https://kitchen-gilt-nine.vercel.app) — web beta (sign up, create project, watch sync across tabs)
- **Stack:** Next.js 16, Convex, Clerk
- **Collab spike:** `npm run spike:pair` — two agents, one relay, editor-agnostic disk sync
- **Not:** another IDE, git hosting site, or required browser for pairing

## CTAs (rotate)

- Get started free → kitchen-gilt-nine.vercel.app
- Try the beta — no credit card
- Open two tabs and save the same file — watch sync

## Hashtags (use sparingly)

`#devtools` `#buildinpublic` `#ShowHN` `#ProductHunt`

## Agent discovery (not product AI)

Kitchen ships **no** LLM — **your** harness answers *"how did this file change?"* via `.kitchen/docs/` + `npx kitchen changes`. Projects live at **`username/project`** (per-account namespace) — **FOSS**, **org**, or **user** scope at the root.

## Do not say

- "No version control" / "no history" (we have insert-only versions — "no git" means no git *commands*)
- "Git killer" / "replace GitHub"
- "AI-powered" / "built-in summarize" (no AI in product — agents use primitives)
- "Revolutionary" / "game-changer"
- Implying automatic three-way merge