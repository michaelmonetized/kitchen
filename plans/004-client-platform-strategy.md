# Plan 004: Specify client platform strategy

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/002-architecture-foundation.md
- **Category**: direction
- **Planned at**: greenfield, 2026-06-18

## Why this matters

The source lists three client surfaces (web, phone, desktop file browser) and hesitates on Electron. Documenting a phased client strategy unblocks future spikes without pretending the decision is final.

## Scope

**In scope:**
- `docs/clients/overview.md`
- `docs/clients/desktop-sync.md`
- `docs/clients/web-and-mobile.md`

## Done criteria

- [ ] Desktop doc covers macOS, Windows, Linux requirement
- [ ] Mirror path documented as `$HOME/Projects/<project>`
- [ ] Electron listed as candidate, not committed decision