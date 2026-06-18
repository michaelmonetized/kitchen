# Plan 002: Document architecture foundation

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/001-domain-model.md
- **Category**: docs
- **Planned at**: greenfield, 2026-06-18

## Why this matters

The architecture is intentionally minimal (users, roles, files). Documenting insert-only versioning, realtime sync, and the `$HOME/Projects` mirror contract gives implementers a shared blueprint before any code is written.

## Scope

**In scope:**
- `docs/architecture/overview.md`
- `docs/architecture/data-model.md`
- `docs/architecture/versioning.md`

## Steps

### Step 1: Architecture overview

System diagram: Sync Store ↔ WebSocket transport ↔ Clients (web, mobile, desktop mirror).

### Step 2: Data model

Tables/collections for users, roles, files with mime types, org/project parent rules, permission properties.

### Step 3: Versioning model

Insert-only semantics, concurrent edit behavior, Pierre merge as the human resolution path.

## Done criteria

- [ ] All three architecture docs exist
- [ ] Versioning doc states: no upsert, no branches, no commits
- [ ] Data model doc includes `org:name` and `role:{name:read|write}` property syntax