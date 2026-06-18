# Kitchen Documentation

Progressive curriculum for learning Kitchen's conceptual design. Read in order the first time through; use reference docs when you need a quick lookup.

**Status:** Design phase. Full product not shipped; `npm run spike:pair` proves collab agent. Docs teach the *target* system.

## Start here

**New to Kitchen?** Read [The Kitchen Way](./the-kitchen-way.md) first — storage, sync, work, and collaboration in one narrative (~15 min).

Keep [GLOSSARY.md](../GLOSSARY.md) open. Kitchen uses tight vocabulary on purpose.

## Learning paths

### Path 0 — The novel model (25 min)

For anyone asking "what is this and how is it different?"

| Step | Doc | Time |
|------|-----|------|
| 1 | [The Kitchen Way](./the-kitchen-way.md) | 15 min |
| 2 | [Three Modes of Work](./concepts/three-modes-of-work.md) | 10 min |

### Path A — New to Kitchen (60–75 min)

For contributors who have never read the source concept.

| Step | Doc | Time | You will know |
|------|-----|------|---------------|
| 0 | [The Kitchen Way](./the-kitchen-way.md) | 15 min | Storage, sync, work, collaboration |
| 1 | [Introduction](./introduction.md) | 5 min | What Kitchen replaces and why |
| 2 | [Getting Started](./getting-started.md) | 10 min | The six invariants |
| 3 | [Files and Versions](./concepts/files-and-versions.md) | 10 min | File rows, version inserts, pointers |
| 4 | [Orgs and Roles](./concepts/orgs-and-roles.md) | 10 min | Tenancy and permissions |
| 5 | [Sync Model](./concepts/sync-model.md) | 10 min | WebSockets, mirror loop, forks |
| 6 | [Live Collaboration](./concepts/live-collaboration.md) | 10 min | Pair sessions, checkpoints |
| 7 | [Pair Programming Walkthrough](./guides/pair-programming-walkthrough.md) | 10 min | nvim + VS Code story |
| 8 | [Exercises](./exercises.md) | 10 min | Retrieval practice (no code) |

Then branch by interest (architecture, clients, or git comparison).

### Path B — Coming from git (30 min)

You already know branches, commits, and merge conflicts. Kitchen reuses none of that machinery.

| Step | Doc | Time | You will know |
|------|-----|------|---------------|
| 1 | [Introduction](./introduction.md) | 5 min | The replacement table |
| 2 | [Git Comparison](./concepts/git-comparison.md) | 15 min | Concept-by-concept mapping |
| 3 | [Versioning](./architecture/versioning.md) | 10 min | Insert-only heads and Pierre Merge |

### Path C — Implementer (60–90 min)

You will write Sync Store mutations or client code.

| Step | Doc | Time | You will know |
|------|-----|------|---------------|
| 1 | [Getting Started](./getting-started.md) | 10 min | Invariants |
| 2 | [Schema](./concepts/schema.md) | 15 min | Tables, mutations, subscriptions |
| 3 | [Data Model](./architecture/data-model.md) | 10 min | ER narrative |
| 4 | [Property Syntax](./reference/property-syntax.md) | 5 min | ACL cheat sheet |
| 5 | [Event Catalog](./reference/event-catalog.md) | 5 min | Subscription events |
| 6 | [Architecture Overview](./architecture/overview.md) | 10 min | System diagram |
| 7 | [Client Overview](./clients/overview.md) | 10 min | Build order |

### Path D — Scenario practice (20 min)

Narrative walkthroughs that tie concepts together.

| Doc | Scenario |
|-----|----------|
| [Solo Workday Walkthrough](./guides/solo-workday-walkthrough.md) | One dev, two machines, live sync |
| [Concurrent Edit Walkthrough](./guides/concurrent-edit-walkthrough.md) | Two editors, fork, Pierre Merge |
| [New Teammate Walkthrough](./guides/new-teammate-walkthrough.md) | Invite, role, mirror appears |

### Path E — Pair programming (20 min)

| Step | Doc | Time |
|------|-----|------|
| 1 | [Live Collaboration](./concepts/live-collaboration.md) | 10 min |
| 2 | [Pair Programming Walkthrough](./guides/pair-programming-walkthrough.md) | 10 min |
| 3 | [Exercises](./exercises.md) — Live collaboration section | 5 min |

## Doc map

### Foundations

- [The Kitchen Way](./the-kitchen-way.md) — **start here** — full onboarding hub
- [Three Modes of Work](./concepts/three-modes-of-work.md) — solo, fork, pair
- [Storage and Sync](./concepts/storage-and-sync.md) — rows, mirror, WebSockets

### Concepts

One idea per page. Completable in under 10 minutes.

- [Files and Versions](./concepts/files-and-versions.md) — File rows, insert-only versions, MIME types
- [Orgs and Roles](./concepts/orgs-and-roles.md) — Tenancy, role table, file properties
- [Sync Model](./concepts/sync-model.md) — Live sync, mirror loop, divergence
- [Schema](./concepts/schema.md) — Implementation contract (Convex reference)
- [Git Comparison](./concepts/git-comparison.md) — Mental model migration from git
- [Permissions](./concepts/permissions.md) — Authorization flow, inheritance, checks
- [Live Collaboration](./concepts/live-collaboration.md) — Pair sessions, Collab agent, checkpoints

### Architecture

System design for implementers.

- [Overview](./architecture/overview.md) — Diagram, data flows, layer responsibilities
- [Data Model](./architecture/data-model.md) — Users, roles, files, versions
- [Versioning](./architecture/versioning.md) — Concurrent inserts, pointer policy, merge
- [Live Collaboration](./architecture/live-collaboration.md) — Collab relay protocol

### Clients

Platform surfaces and build order.

- [Overview](./clients/overview.md) — Desktop, web, mobile matrix
- [Desktop Sync](./clients/desktop-sync.md) — Mirror driver, echo suppression
- [Web and Mobile](./clients/web-and-mobile.md) — Browser-first build path
- [Collab Agent](./clients/collab-agent.md) — Editor-agnostic pair programming
- [Optional Editor Plugins](./clients/editor-plugins.md) — In-editor presence (post-v0)

### Guides

Scenario walkthroughs — knowledge applied to a story.

- [Solo Workday Walkthrough](./guides/solo-workday-walkthrough.md)
- [Pair Programming Walkthrough](./guides/pair-programming-walkthrough.md)
- [Concurrent Edit Walkthrough](./guides/concurrent-edit-walkthrough.md)
- [New Teammate Walkthrough](./guides/new-teammate-walkthrough.md)

### Teach assets (HTML)

Optional browser-friendly formats alongside markdown.

- [Lesson 0001 — Four Layers, Three Modes](../lessons/0001-four-layers-and-three-modes.html) — intro + retrieval quiz
- [Printable cheat sheet](../reference/three-modes.html) — four layers, three modes, invariants

### Reference

Compressed lookup. Revisit these often.

- [Quick Reference](./reference/quick-reference.md) — one-page cheat sheet
- [Property Syntax](./reference/property-syntax.md) — ACL keys and examples
- [Event Catalog](./reference/event-catalog.md) — Subscription events and payloads
- [Pierre Integration](./reference/pierre-integration.md) — Diff, merge, tree primitives

### Practice and FAQ

- [Exercises](./exercises.md) — Retrieval practice with answers
- [FAQ](./faq.md) — Common misconceptions

## External grounding

Kitchen's design is original, but these resources help you place it in context:

- [Google Drive sync architecture (conceptual)](https://developers.google.com/drive) — Familiar mirror mental model
- [Event sourcing (Martin Fowler)](https://martinfowler.com/eaaDev/EventSourcing.html) — Insert-only versions as per-file event logs
- [Convex docs](https://docs.convex.dev/) — Reference Sync Store implementation profile

## Questions

These docs are the curriculum. If a section feels abstract, ask for a follow-up lesson on that specific topic — terminology should stay compressed and unambiguous.