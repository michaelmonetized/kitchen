# Plan 001: Define domain model and shared vocabulary

> **Executor instructions**: Follow this plan step by step. When done, update the status row in `plans/README.md`.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: greenfield, 2026-06-18

## Why this matters

The source concept names orgs, projects, roles, and files informally. Without canonical definitions, every doc and future module will invent incompatible terminology. CONTEXT.md and GLOSSARY.md are the compression layer that keeps the project coherent.

## Scope

**In scope:**
- `CONTEXT.md`
- `GLOSSARY.md`

**Out of scope:**
- Implementation code
- Backend schema migrations

## Steps

### Step 1: Write CONTEXT.md

Define the three top-level entities (users, roles, files) and how orgs/projects map to `dir` file types with parent constraints.

**Verify**: `grep -c "## " CONTEXT.md` returns ≥ 4 section headings.

### Step 2: Write GLOSSARY.md

Opinionated glossary per teach skill format. Terms: Kitchen, File, Version, Org, Project, Role, Mirror, Sync Store, Pierre Merge.

**Verify**: `grep -c "^\*\*" GLOSSARY.md` returns ≥ 10 terms.

## Done criteria

- [ ] CONTEXT.md exists with entity hierarchy and permission property syntax
- [ ] GLOSSARY.md exists with Avoid aliases for each term
- [ ] No term in GLOSSARY contradicts `raw/A New Way To Code.md`