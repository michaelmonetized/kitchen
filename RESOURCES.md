# Resources

High-trust materials for grounding Kitchen concepts. Prefer these over parametric knowledge.

## Kitchen (this repo)

| Resource | URL / path | Why |
|----------|------------|-----|
| Vision | [VISION.md](./VISION.md) | Mission and constraints |
| Domain language | [CONTEXT.md](./CONTEXT.md) | Entity hierarchy |
| Glossary | [GLOSSARY.md](./GLOSSARY.md) | Canonical terms |
| Doc curriculum | [docs/README.md](./docs/README.md) | Learning paths |
| Onboarding hub | [docs/the-kitchen-way.md](./docs/the-kitchen-way.md) | Storage, sync, work, collaboration narrative |
| Three modes | [docs/concepts/three-modes-of-work.md](./docs/concepts/three-modes-of-work.md) | Solo, fork, pair |
| Quick reference | [docs/reference/quick-reference.md](./docs/reference/quick-reference.md) | One-page markdown cheat sheet |
| Lesson 0001 (HTML) | [lessons/0001-four-layers-and-three-modes.html](./lessons/0001-four-layers-and-three-modes.html) | Tufte-style intro + quiz |
| Printable cheat sheet | [reference/three-modes.html](./reference/three-modes.html) | Four layers, three modes, invariants |

## Mirror and sync mental models

| Resource | URL | Why |
|----------|-----|-----|
| Google Drive API overview | https://developers.google.com/drive/api/guides/about-sdk | Cloud-authoritative files, local clients |
| Dropbox sync architecture (blog) | https://dropbox.tech/application/sync-architecture-dropbox | Bidirectional sync patterns |

## Event sourcing and versioning

| Resource | URL | Why |
|----------|-----|-----|
| Martin Fowler — Event Sourcing | https://martinfowler.com/eaaDev/EventSourcing.html | Insert-only versions as per-file logs |
| Martin Fowler — CQRS | https://martinfowler.com/bliki/CQRS.html | Separating writes (insert) from read views (pointer) |

## Reference implementation profile

| Resource | URL | Why |
|----------|-----|-----|
| Convex documentation | https://docs.convex.dev/ | WebSockets, live queries, mutations |
| Lakebed docs | https://docs.lakebed.dev/ | Agent-native capsules: auth + live DB + WS mutations in one CLI |
| Convex file storage | https://docs.convex.dev/file-storage | Binary blob patterns (compare to version column approach) |

## Diff and merge UX

| Resource | URL | Why |
|----------|-----|-----|
| Pierre (project) | TBD during implementation spike | Named in source concept for line-pick merge |

## Learning science (curriculum design)

| Resource | URL | Why |
|----------|-----|-----|
| Retrieval practice (Roediger & Butler) | https://www.washington.edu/news/2014/02/27/improve-learning-with-retrieval-practice/ | Exercises.md design rationale |

## Communities (wisdom)

| Community | URL | When to join |
|-----------|-----|--------------|
| Convex Discord | https://convex.dev/community | When implementing Sync Store on Convex |
| r/eventdrivenarchitecture | https://www.reddit.com/r/eventdrivenarchitecture/ | Event-sourced design discussions |