# Introduction

Kitchen reimagines where code lives — and how you **store**, **sync**, **work on**, and **collaborate on** it.

**New here?** Read [The Kitchen Way](./the-kitchen-way.md) for the full onboarding story (15 min).

Today, a "project" is a folder on disk plus a `.git` directory plus a hosting remote. Collaboration is async: branch, commit, push, open PR, review, merge. Realtime co-editing exists for documents — Kitchen brings that model to code **without** becoming an IDE.

Kitchen collapses that stack into four ideas:

1. **The Sync Store is the source of truth** — files are rows, not server paths.
2. **Your machine gets a Mirror** — `$HOME/Projects` updates in realtime, so existing editors work unchanged.
3. **Versions are insert-only** — every save creates history automatically; merge is a deliberate human act via Pierre diff.
4. **Live collab is a first-class mode** — pair programming via a **Collab agent** on each machine; checkpoints insert versions. See [Live Collaboration](./concepts/live-collaboration.md).

This is not "git in the cloud." Kitchen removes commits, branches, and pull requests by design. The tradeoff is intentional: simpler mental model for live collaboration, different merge UX when edits diverge.

## What Kitchen replaces

| Today (git-centric) | Kitchen |
|---------------------|---------|
| `git clone` | Log in; projects appear in `$HOME/Projects` |
| `git commit` | Save file → new version row inserted |
| `git push / pull` | WebSocket push; always live |
| Branch + PR + merge | Concurrent versions + Pierre Merge |
| Repo hosting (GitHub) | Sync Store + org/project tenancy |

Kitchen does **not** replace your editor, linter, or terminal. It replaces how project bytes are stored, versioned, synced, and shared.

## Who Kitchen is for

- **Solo builders** who want projects everywhere without clone/fetch overhead
- **Small teams** who edit together in realtime more than they branch-and-review
- **Org admins** who need role-based access without managing git hosting infrastructure

## Who Kitchen is not for (yet)

- Teams with heavy git workflow requirements (long-lived branches, signed commits, complex rebases)
- Projects that depend on git hooks and SHA-based CI triggers without adaptation
- Anyone who needs production-grade hosting today — Kitchen is in design phase

## Core entities

Kitchen limits its architecture to three top-level entities. Learn these before reading further:

| Entity | One-line definition |
|--------|---------------------|
| **User** | You, authenticated |
| **Role** | Named read/write permission bundle |
| **File** | Everything else — orgs, projects, folders, source, binaries |

Orgs and projects are not separate tables. They are **files of type `dir`** with parent rules. See [Orgs and Roles](./concepts/orgs-and-roles.md).

## How to read these docs

Docs follow a teach-style progression: one concept per page, glossary-consistent language, short sections. See [Documentation README](./README.md) for learning paths (new contributor, git refugee, implementer).

0. [The Kitchen Way](./the-kitchen-way.md) — storage, sync, work, collaboration hub
1. **You are here** — Introduction
2. [Getting Started](./getting-started.md) — six invariants
3. [Concepts](./concepts/files-and-versions.md) — deep dives on one idea each
4. [Architecture](./architecture/overview.md) — system design
5. [Clients](./clients/overview.md) — web, mobile, desktop
6. [Exercises](./exercises.md) — retrieval practice

Coming from git? Skip ahead to [Git Comparison](./concepts/git-comparison.md) after Getting Started.

Keep [GLOSSARY.md](../GLOSSARY.md) open. If a sentence uses a word not in the glossary, file an issue — the vocabulary should stay tight.

## Next

Continue to [Getting Started](./getting-started.md) for the six invariants, or [Three Modes of Work](./concepts/three-modes-of-work.md) for how solo, fork, and pair differ.