# Mission: Kitchen

## Why

Traditional version control optimizes for **async** collaboration: branches, commits, pull requests, merges. That model fights realtime work — and it treats the filesystem as the implicit source of truth until you push.

Kitchen asks a different question: **what if your codebase lived in a cloud Sync Store and mirrored to your machine like Google Drive mirrors documents?**

The goal is not another IDE or another git hosting site. Kitchen is a novel stack for **storage, sync, work, and collaboration**:

| Layer | Novel idea |
|-------|------------|
| **Storage** | Files are rows; versions are append-only history — not server paths or git objects |
| **Sync** | Live WebSocket push — not commit/push/pull |
| **Work** | Mirror at `$HOME/Projects` — any editor, any terminal, no vendor lock-in |
| **Collaboration** | Three modes: solo sync, async fork+merge, live pair via Collab agent |

Project files should feel **local** while being **globally live** — versioned without commit ceremonies, mergeable through human line-picking when edits diverge, pairable across nvim and VS Code without a browser.

## The Kitchen way (in one breath)

**Cloud holds truth. Disk is a mirror. Save inserts history. Sync is always on. Pair uses a background agent. Voice stays on Discord.**

Read the full onboarding narrative: [docs/the-kitchen-way.md](./docs/the-kitchen-way.md).

## Success looks like

### Storage and sync

- A developer opens `$HOME/Projects/my-app/src/index.ts` in their editor of choice and saves. Every other logged-in machine sees the change within seconds.
- Binary artifacts (build outputs, images) store alongside text in the same file/version model without a separate blob service.
- A new team member logs in, gets assigned a role, and their projects appear under `$HOME/Projects` without cloning, fetching, or branch checkout.

### Work

- Sam uses Zed on a laptop and VS Code on a desktop — same project, same mirror contract, zero git operations in the loop.
- Org admins create roles, assign members, and transfer project ownership without touching infrastructure.

### Collaboration

- Two people edit the same file **without** pairing. Both versions exist. **Pierre Merge** composes a new version from line-picks.
- Two developers join a **collab session** on the same file — one in **Neovim**, one in **VS Code** — with no browser and no Kitchen plugins. Each machine's **Collab agent** bridges the mirror to the relay. They coordinate voice on Discord or a phone call; Kitchen handles edits only. On checkpoint, a single **version** inserts.

## Constraints

- **Three entities only** at the architecture top level: users, roles, files. Resist entity sprawl.
- **Insert-only versions**. No upsert on the version layer. Divergence is a feature, not a bug.
- **Mirror contract** is `$HOME/Projects` on desktop. Web and mobile are first-class but do not require local sync.
- **Editor-agnostic work**. Kitchen is storage and sync — not an IDE. Web is tree, diff, blame, history, rollback, and ACL — not a `<textarea>` editor.
- **Collab is protocol, not entity**. Ephemeral session state must not become a fourth top-level Sync Store table.
- **Pierre primitives first**. Fork diff/merge tooling only when integration blocks first-principles goals.
- **Backend-agnostic**. Convex is a reference, not a dependency. The Sync Store contract matters; the vendor does not.
- **Codename phase**. "Kitchen" is internal until product naming is deliberate.

## Out of scope (for now)

- Git import/export as a primary onboarding path
- Automatic three-way merge without human line selection
- Branching, release trains, and semver-from-VCS workflows
- Building a custom NoSQL engine before client spikes prove the mirror contract
- IDE features (LSP hosting, terminals, preview servers)
- Built-in voice, video, or text chat — use phone, Meet, Discord, etc.
- Built-in AI / LLM / "summarize edits" — harnesses already know Convex + VCS; they discover via `.kitchen/docs` + `npx convex` (emergent, not a Kitchen feature)
- Terminal sharing (shared live shell) — each developer runs their own terminal
- Required per-editor plugins for pair programming — v0 uses **Collab agent** only
- Production auth, billing, and SOC2 — design for them, ship them later

## Learn the model

| Start here | Time |
|------------|------|
| [The Kitchen Way](./docs/the-kitchen-way.md) | 15 min |
| [Getting Started](./docs/getting-started.md) | 10 min |
| [Three Modes of Work](./docs/concepts/three-modes-of-work.md) | 10 min |
| [Exercises](./docs/exercises.md) | 10 min |
| [Lesson 0001](./lessons/0001-four-layers-and-three-modes.html) | 5 min |
| [Cheat sheet](./reference/three-modes.html) | 2 min (print) |