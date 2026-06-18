# Plan 011: Optional editor plugins for in-editor presence (post-v0)

> **Executor instructions**: Documentation + optional spike. Run only after plan 010 Collab agent spike succeeds OR documents autowrite latency is unacceptable.

## Status

- **Priority**: P3
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/010-editor-adapter-implementation-spike.md
- **Category**: direction
- **Planned at**: greenfield, 2026-06-18

## Why this matters

Collab agent + autowrite is editor-agnostic but cannot show **remote cursors inside** nvim/VS Code. Optional plugins connect to Collab agent localhost API for presence and optionally faster op capture than disk watcher.

## Scope

**In scope**:
- Update `docs/clients/collab-agent.md` — plugins optional section
- Spike one plugin (VS Code OR nvim) for cursor presence only

**Out of scope**:
- Making plugins required for pairing
- Voice, chat, terminal sharing

## Done criteria

- [ ] Docs state plugins enhance presence, not pairing itself
- [ ] At most one plugin spike if pursued

## STOP conditions

- Plan 010 not complete — defer