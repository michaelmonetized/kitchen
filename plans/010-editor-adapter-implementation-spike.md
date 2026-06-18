# Plan 010: Spike Collab agent (editor-agnostic mirror bridge)

> **Executor instructions**: Implementation spike. Prerequisite: plans 006–009 docs complete.
>
> **Supersedes:** prior revision requiring kitchen-vscode + kitchen.nvim as v0. v0 proves **Collab agent** only.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/007-live-collab-architecture.md, plans/008-live-collab-client-strategy.md
- **Category**: direction
- **Planned at**: greenfield, 2026-06-18

## Why this matters

Prove pair programming works with **zero editor plugins**: two machines, two arbitrary editors, one mirror path each, Collab agent bridging to relay.

## Scope

**In scope**:
- Collab relay dev server (minimal)
- Collab agent module in desktop client (or standalone `kitchen-collab-agent` binary for spike)
- File watcher → diff → op on mirrored test file
- Remote op → mirror write with echo suppression
- Checkpoint → mock `versions.insert`

**Out of scope**:
- Editor plugins
- Voice/chat/Discord
- Terminal sharing
- Production auth

## Spike acceptance criteria

1. Machine A: edit `test.ts` in **any** editor with autosave/autowrite enabled
2. Machine B: edit same file in a **different** editor
3. Changes appear on B's mirror within 1s (autowrite-dependent)
4. Checkpoint produces one version insert
5. No browser, no VS Code extension, no nvim plugin involved

## STOP conditions

- Watcher-only path cannot achieve <2s sync with standard autowrite — report; recommend plan 011 optional plugins for sub-second, do not block v0 on plugins
- Requires fourth Sync Store entity — STOP

## Maintenance notes

- Outcome BLOCKED or DONE recorded in `plans/README.md`