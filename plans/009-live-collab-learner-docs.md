# Plan 009: Add progressive learner docs for live pair programming

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: Confirm plans 006–008 docs exist. Required files: `GLOSSARY.md` (collab terms), `docs/architecture/live-collaboration.md`, updated `docs/clients/web-and-mobile.md`.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/006-live-collab-vocabulary.md, plans/007-live-collab-architecture.md, plans/008-live-collab-client-strategy.md
- **Category**: docs
- **Planned at**: greenfield, 2026-06-18

## Why this matters

Plan 005 established teach-style progressive docs. Live collab introduces non-obvious distinctions (sync vs collab, ephemeral vs checkpoint, op redirect vs versions.insert). Without a concept page and walkthrough, contributors will conflate pair programming with "fast WebSocket sync" or assume browser-only pairing.

## Current state

- `docs/README.md` — learning paths have no collab step
- `docs/exercises.md` — no collab retrieval questions
- `docs/faq.md` — collaboration section covers fork/merge only
- `docs/getting-started.md` — five invariants omit collab
- No `docs/concepts/live-collaboration.md`
- No pair programming walkthrough in `docs/guides/`

Teach format reference: `plans/005-progressive-learner-docs.md` — concept docs < 10 min, glossary-consistent.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Concept doc | `test -f docs/concepts/live-collaboration.md && echo ok` | ok |
| Walkthrough | `test -f docs/guides/pair-programming-walkthrough.md && echo ok` | ok |
| Curriculum | `grep -i 'live.collab\|pair programming' docs/README.md` | ≥ 2 |
| Exercises | `grep -c 'collab\|checkpoint\|presence' docs/exercises.md` | ≥ 3 |
| FAQ | `grep -i 'pair programming\|live collab' docs/faq.md` | ≥ 2 |
| Line budget | `wc -l docs/concepts/live-collaboration.md` | ≤ 150 (keep < 10 min read) |

## Scope

**In scope**:
- `docs/concepts/live-collaboration.md` (create)
- `docs/guides/pair-programming-walkthrough.md` (create)
- `docs/README.md`
- `docs/getting-started.md` (add sixth invariant or collab callout)
- `docs/exercises.md`
- `docs/faq.md`
- `README.md` (doc map)

**Out of scope**:
- Architecture or client docs (plans 007–008)
- HTML lessons (`lessons/`)

## Steps

### Step 1: Create docs/concepts/live-collaboration.md

One concept per page. Sections:

1. **Live sync vs live collab** — table (latency, durability, events) — use GLOSSARY terms only
2. **Collab session** — ephemeral, one file, base version
3. **Presence** — cursors not versions
4. **Checkpoints** — the only durable write
5. **What happens on fork** — external save during session → stale session or Pierre Merge
6. **Collab agent** — background service, any mirror editor (link to collab-agent.md)
7. **Autowrite** — why autosave matters when agent watches disk
8. **Comms external** — voice on Discord/Meet/phone; Kitchen does not build chat
9. **Op redirect** — during session, mirror changes → ops not version inserts

Primary source citation: link to `docs/architecture/live-collaboration.md`.

Related links to sync-model, versioning, collab-agent, desktop-sync.

**Verify**: `wc -l docs/concepts/live-collaboration.md` → 80–150 lines

### Step 2: Create pair programming walkthrough

`docs/guides/pair-programming-walkthrough.md` — narrative like `docs/guides/concurrent-edit-walkthrough.md`:

**Cast**: Alice (driver, **Neovim**), Bob (navigator, **VS Code**), file `utils.ts`

**Timeline**:
- T+0: Alice `kitchen pair join utils.ts` (tray/CLI); Bob same; Collab agents on both machines join relay. They're on a Discord call (external).
- T+1: Alice types in nvim (autowrite on); Bob sees file change in VS Code within ~autowrite delay
- T+2: Either user checkpoints → v5 inserts; mirrors update for disk-backed tools
- T+3: (optional) Charlie solo-saves same file outside session → session.stale → rebase

Include retrieval check (3 questions).

**Verify**: `grep -c 'checkpoint' docs/guides/pair-programming-walkthrough.md` → ≥ 2

### Step 3: Update docs/README.md learning paths

Add to Path A after Sync Model:

| Step | Doc | Time |
| Live collab concept | `concepts/live-collaboration.md` | 10 min |
| Pair story | `guides/pair-programming-walkthrough.md` | 10 min |

Add Path E — Pair programming focus (20 min): concept → walkthrough → exercises collab section.

**Verify**: Path includes live-collaboration.md

### Step 4: Update getting-started.md

Option A: Add **6. Collab is ephemeral until checkpoint** invariant.

Or add subsection under invariants explaining collab without renumbering five core invariants — executor picks cleaner fit based on doc flow.

Link to `concepts/live-collaboration.md`.

**Verify**: `grep -i 'checkpoint\|collab' docs/getting-started.md` → ≥ 2

### Step 5: Extend exercises.md

Add section `## Live collaboration` with 5 questions (same format as existing — hidden answers):

1. Live sync vs live collab difference
2. Are cursor positions version rows?
3. What creates a durable version during pair session?
4. What happens to mirror watcher events during an active session?
5. External save during session causes what event?
6. Does Kitchen include voice chat for pairing?
7. Is a VS Code extension required to pair?

**Verify**: 5 new questions with `<details>` answers

### Step 6: Extend FAQ

Add under Collaboration:

- "Does Kitchen support pair programming?"
- "Is live collab the same as live sync?"
- "Can I pair in nvim while my teammate uses VS Code?"
- "Do I need a browser to pair?"
- "How often are versions created during a pair session?" (checkpoints, not keystrokes)

**Verify**: 4 new FAQ entries

### Step 7: Update root README.md doc map

Add under Concepts and Guides:

- `docs/concepts/live-collaboration.md`
- `docs/guides/pair-programming-walkthrough.md`

**Verify**: both paths in README.md

## Test plan

Grep/line-count verification only.

## Done criteria

- [ ] Concept doc < 150 lines, glossary-consistent
- [ ] Pair programming walkthrough with timeline and retrieval check
- [ ] Curriculum, exercises, FAQ, README updated
- [ ] Getting started references collab/checkpoint
- [ ] `plans/README.md` status row for 009 updated to DONE

## STOP conditions

- Plans 007/008 docs missing — STOP.
- GLOSSARY lacks collab terms — STOP, run 006.

## Maintenance notes

- Exercises must not use unequal answer lengths as hints (teach skill rule) — keep answers similar word count where possible.
- Future HTML lessons should link to these markdown sources.