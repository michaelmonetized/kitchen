# Hacker News — Show HN

> **DRAFT — do not post until [`grilling/02-launch-gate.md`](./grilling/02-launch-gate.md) passes.**

Platform: [news.ycombinator.com/show](https://news.ycombinator.com/show)  
Post when: Same day as Product Hunt, ~8–9 AM PT — **only after** `$HOME/Projects` mirror is live

---

## Title

```
Show HN: Kitchen – Cloud project store with live sync, no git
```

Alternate if too long:

```
Show HN: Kitchen – Files as DB rows, live sync to $HOME/Projects
```

---

## First comment (post immediately after submit)

Hi HN — Michael here. I've been building Kitchen as a different answer to "where does my code live?"

**The problem I kept hitting:** git is great for async review, but it's the wrong default for live work. I don't want to spend brain cells on `add` / `commit` / `push` / `pull` / `rebase` — I want saves tracked and synced. Every disk save is invisible until that loop completes. Pair programming means screen share or IDE-specific extensions. Concurrent edits mean conflict markers.

**"No git"** = no git command loop. History stays (insert-only version rows). Merge stays (human line-pick when forks diverge).

**What Kitchen is:** a cloud Sync Store where files are database rows and content is append-only version history. Save in your editor → `versions.insert` → WebSocket fan-out → every logged-in machine sees the change in seconds. Your laptop's `$HOME/Projects/my-app` is a mirror the desktop client maintains — not the source of truth.

**What it's not:** another IDE, another git host, or a browser-only editor. Kitchen doesn't run LSP or terminals. You keep nvim, VS Code, Zed, `make`, whatever reads the mirror path.

**Three collaboration modes:**

1. **Solo sync** — default; live fan-out on every save
2. **Fork + merge** — two people save without pairing; both versions exist; merge by picking lines in a Pierre diff (human merge, not auto-three-way)
3. **Live pair** — Collab agent per machine bridges mirror ↔ relay; checkpoint inserts one version. Voice stays on Discord — Kitchen handles edits only.

**Try the web beta:** https://kitchen-gilt-nine.vercel.app — sign up, create a project, open two tabs, save in one, watch the other. Convex reactivity handles the live sync.

**Architecture choices I'm happy to discuss:**

- Three entities at the top: users, roles, files. Orgs and projects are `dir` rows. No `collab_sessions` table — collab is protocol, not persistence.
- **ACL on file properties** — `role:editor:write` / `role:viewer:read` on rows; walk ancestor chain on every read/insert; child overrides parent. `user_roles` can scope a role to a single project. No separate ACL table.
- Insert-only versions. Divergence is a feature (`forked: true`), not an error.
- Convex is the reference backend, not a hard dependency. The Sync Store contract is what matters.

**Honest limits:** Desktop mirror driver is a spike, not shipped in the web beta. Collab proof runs via `npm run spike:pair` in the repo. "Kitchen" is a codename.

I'd love feedback on the model itself — especially from people who've wanted live sync without giving up local editors, and from anyone who thinks this is solving the wrong layer.

---

## Reply templates

**"How is this different from [Dropbox / Syncthing / Live Share]?"**

> Dropbox syncs bytes on disk; Kitchen syncs versioned rows in a Sync Store and rebuilds the mirror from subscriptions. Live Share is editor-specific; Kitchen's Collab agent is editor-agnostic — nvim and VS Code pair without plugins. Git is async by design; Kitchen doesn't use commit/push as the sync primitive.

**"Why no git import?"**

> Out of scope for the beta. Kitchen is a first-principles store, not a git remote. Import/export may come later; onboarding path today is "create project, start writing."

**"What about binary files / large repos?"**

> Same file/version model for binaries — no separate blob service in the design. Practical limits are what Convex and the mirror driver handle; haven't stress-tested monorepo scale yet.

**"Merge conflicts?"**

> No conflict markers. Concurrent saves create forks. Pierre Merge UI lets you pick lines side-by-side; merge inserts a new version with `parentVersionIds`. Automatic three-way merge is explicitly out of scope.

---

## Show HN rules reminder

- No voting solicitation
- Post link goes to the live product (not a landing page with no product)
- Be in comments all day