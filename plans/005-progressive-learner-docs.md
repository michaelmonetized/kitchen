# Plan 005: Write progressive learner docs (teach skill)

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: LOW
- **Depends on**: plans/003-core-documentation.md, plans/004-client-platform-strategy.md
- **Category**: docs
- **Planned at**: greenfield, 2026-06-18

## Why this matters

Matt Pocock's teach skill optimizes for progressive disclosure: mission-grounded, glossary-consistent, short units that build storage strength. Apply that philosophy to project docs so readers learn Kitchen in a deliberate sequence.

## Scope

**In scope:**
- `docs/introduction.md`
- `docs/getting-started.md`
- `docs/concepts/files-and-versions.md`
- `docs/concepts/orgs-and-roles.md`
- `docs/concepts/sync-model.md`
- `docs/reference/pierre-integration.md`

## Reading order

1. introduction.md — what Kitchen is and what it replaces
2. getting-started.md — mental model setup for contributors
3. concepts/* — one idea per doc
4. architecture/* — system design
5. clients/* — platform surfaces

## Done criteria

- [x] Each concept doc is completable in < 10 minutes
- [x] All docs use GLOSSARY terms consistently
- [x] introduction.md links forward to getting-started.md only (no wall of links)

## Expansion (2026-06-18)

Added curriculum hub and teach-style layers:

- `docs/README.md` — learning paths A–D
- `docs/concepts/git-comparison.md`, `permissions.md`
- `docs/guides/concurrent-edit-walkthrough.md`, `new-teammate-walkthrough.md`
- `docs/reference/property-syntax.md`, `event-catalog.md`
- `docs/exercises.md`, `docs/faq.md`
- `MISSION.md`, `RESOURCES.md`, `NOTES.md` for teach workspace