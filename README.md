# Kitchen

> **Codename.** Kitchen is a working title for a cloud-native project store. The name will change before any public launch.

**Your projects live in the cloud. Your editor sees them on disk. There is no git.**

Kitchen is a novel way to **store**, **sync**, **work on**, and **collaborate on** code — four layers, one model:

| Layer | What Kitchen does |
|-------|-------------------|
| **Storage** | Files and folders are database rows; every save appends a **Version** |
| **Sync** | WebSockets push changes in seconds — no push/pull |
| **Work** | Mirror to `$HOME/Projects`; use nvim, VS Code, Zed, anything |
| **Collaboration** | Solo sync, async merge, or live pair via **Collab agent** |

Save in your editor → history is automatic. Pair with a teammate in different editors → no browser required. When edits diverge → pick lines in a Pierre diff, not conflict markers.

## New here?

**Start with [The Kitchen Way](./docs/the-kitchen-way.md)** — 15-minute onboarding hub for the full mental model.

Then:

1. [Getting Started](./docs/getting-started.md) — six invariants to memorize
2. [Three Modes of Work](./docs/concepts/three-modes-of-work.md) — solo, fork, pair
3. [Exercises](./docs/exercises.md) — test your recall

Coming from git? Add [Git Comparison](./docs/concepts/git-comparison.md) early.

## Build the web product

Autonomous agent loop (14 tasks, `./web`):

```bash
./loop.sh                    # gx agents until shippable
npm run loop:status          # inspect task progress
```

Tasks: [tasks/README.md](./tasks/README.md). Agent guide: [AGENTS.md](./AGENTS.md).

## Try it

**[kitchen-gilt-nine.vercel.app](https://kitchen-gilt-nine.vercel.app)** — web beta (Clerk dev instance, Convex production).

Sign up, create a project, edit a file, and watch live sync across tabs.

**Mirror client** (local editor sync):

```bash
npm install && npm run build -w @kitchen/mirror-client && npm run login -w @kitchen/mirror-client && npm run mirror
```

**Kitchen CLI** (agent/human history + auth):

```bash
npm run build:cli
npx kitchen auth                              # browser OAuth → ~/.kitchen/auth.json
npx kitchen changes src/index.ts --limit 10   # version history JSON
```

```bash
cd web && npm run ship          # Convex prod + Vercel prod + smoke
SMOKE_BASE_URL=https://kitchen-gilt-nine.vercel.app node web/scripts/smoke.mjs
node scripts/mirror-smoke.mjs   # bidirectional mirror proof
```

## Status

**Web beta shipped.** Tasks 001–014 complete in `./web` (Next.js + Convex + Clerk). Collab proof in `packages/`:

```bash
npm install
npm run spike:pair   # two agents, one relay, editor-agnostic disk sync
```

## Quick links

| Doc | What you'll learn |
|-----|-------------------|
| [VISION.md](./VISION.md) | Why Kitchen exists — storage, sync, work, collaboration |
| [The Kitchen Way](./docs/the-kitchen-way.md) | **Best start for new users** |
| [GLOSSARY.md](./GLOSSARY.md) | Canonical terms |
| [Quick Reference](./docs/reference/quick-reference.md) | One-page cheat sheet |
| [Lesson 0001](./lessons/0001-four-layers-and-three-modes.html) | Browser intro + quiz |
| [Cheat sheet (print)](./reference/three-modes.html) | Four layers, three modes |
| [Introduction](./docs/introduction.md) | Problem statement |
| [Getting Started](./docs/getting-started.md) | Invariants |

Full curriculum: [docs/README.md](./docs/README.md).

## Documentation map

### Foundations

- [The Kitchen Way](./docs/the-kitchen-way.md) — onboarding hub
- [Three Modes of Work](./docs/concepts/three-modes-of-work.md) — solo, fork, pair
- [Storage and Sync](./docs/concepts/storage-and-sync.md) — rows, mirror, WebSockets

### Concepts

- [Files and Versions](./docs/concepts/files-and-versions.md) — insert-only versioning
- [Orgs and Roles](./docs/concepts/orgs-and-roles.md) — tenancy
- [Sync Model](./docs/concepts/sync-model.md) — live sync
- [Live Collaboration](./docs/concepts/live-collaboration.md) — pair sessions
- [Git Comparison](./docs/concepts/git-comparison.md) — from git to Kitchen
- [Permissions](./docs/concepts/permissions.md) — ACL flow
- [Schema](./docs/concepts/schema.md) — implementation contract

### Architecture

- [Overview](./docs/architecture/overview.md) — system diagram
- [Data Model](./docs/architecture/data-model.md) — users, roles, files
- [Versioning](./docs/architecture/versioning.md) — forks, pointers, merge
- [Live Collaboration](./docs/architecture/live-collaboration.md) — collab relay

### Clients

- [Overview](./docs/clients/overview.md) — desktop, web, mobile
- [Desktop Sync](./docs/clients/desktop-sync.md) — mirror driver
- [Collab Agent](./docs/clients/collab-agent.md) — editor-agnostic pairing
- [Web and Mobile](./docs/clients/web-and-mobile.md)

### Guides (stories)

- [Solo Workday](./docs/guides/solo-workday-walkthrough.md) — one dev, two machines
- [Pair Programming](./docs/guides/pair-programming-walkthrough.md) — nvim + VS Code
- [Concurrent Edit](./docs/guides/concurrent-edit-walkthrough.md) — fork + Pierre Merge
- [New Teammate](./docs/guides/new-teammate-walkthrough.md) — no clone

### Practice

- [Exercises](./docs/exercises.md) — retrieval practice
- [FAQ](./docs/faq.md) — misconceptions

### Plans

Implementation plans: [`plans/`](./plans/README.md).

## The idea in one paragraph

What if code was no longer stored as files on disk at the source of truth? What if your project's tree lived in the cloud as database entries, versioned automatically on every change, synced live to any machine you're logged into? Your disk would be a mirror — like Google Drive for code — so existing editors keep working. Solo work is live sync. Accidental concurrent saves create parallel versions you merge by picking lines. Pair programming uses a background Collab agent per machine, so nvim and VS Code pair without plugins. Voice stays on Discord. That's Kitchen.

## Source

Kitchen descends from the concept note *A New Way To Code* (Michael Hurley, Second Brain vault, 2026).