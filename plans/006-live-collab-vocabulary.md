# Plan 006: Extend domain vocabulary for live collaboration

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: Compare "Current state" excerpts against live files. This repo may not be a git repository; if `git rev-parse` fails, compare by reading files directly.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (extends plans 001–005)
- **Category**: direction
- **Planned at**: greenfield, 2026-06-18

## Why this matters

Kitchen docs distinguish **live sync** (version inserts propagate in seconds) from **live collaboration** (two people edit the same buffer simultaneously with shared cursors). Today `docs/introduction.md:5` still says "Realtime co-editing exists in Google Docs, not in your codebase" — contradicting the product direction. Without canonical terms, implementers will either bolt on a fourth database entity (violating the three-entity constraint) or conflate sync latency with pair programming.

## Current state

Relevant files:

- `GLOSSARY.md` — defines **Live sync** (`GLOSSARY.md:51-53`) but has no collab terms
- `CONTEXT.md` — collaboration described as "live sync plus human-driven Pierre Merge" (`CONTEXT.md:9`) with no shared-buffer model
- `VISION.md` — success criteria mention concurrent edits and merge (`VISION.md:11-12`) but not simultaneous co-editing
- `docs/introduction.md:5` — explicitly excludes realtime co-editing from codebases

Three-entity constraint from `CONTEXT.md:13-21`:

```
Kitchen deliberately limits itself to three concerns:
| Entity | Responsibility |
| **User** | Identity, authentication, org membership |
| **Role** | Named permission bundles scoped to an org or project |
| **File** | Every piece of content — source text, directories, binaries |
```

Collab must be documented as a **protocol layer**, not a fourth persisted entity.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Term count | `grep -c '^\*\*' GLOSSARY.md` | ≥ 15 (was ~14 before new terms) |
| Section count | `grep -c '^## ' CONTEXT.md` | ≥ 5 |
| Stale phrase gone | `grep -n 'not in your codebase' docs/introduction.md` | no matches |
| New terms present | `grep -E 'Live collab|Collab [Ss]ession|Presence|Checkpoint' GLOSSARY.md` | ≥ 4 matches |

## Scope

**In scope**:
- `GLOSSARY.md`
- `CONTEXT.md`
- `VISION.md`
- `docs/introduction.md`

**Out of scope**:
- Architecture protocol details (plan 007)
- Client implementation (plan 008)
- `docs/concepts/schema.md` table changes (plan 007 handles API additions)

## Steps

### Step 1: Add collaboration terms to GLOSSARY.md

Add a new `## Collaboration` section after `## Operations` with these terms (use existing glossary format: term, definition, `_Avoid_` aliases):

| Term | Definition sketch |
|------|-------------------|
| **Live collab** | Simultaneous editing of one file by multiple users in a shared session — sub-second operation broadcast, shared cursors, ephemeral until checkpoint. |
| **Collab session** | Ephemeral room bound to one File and one base Version; not a Sync Store entity. Participants join via WebSocket channel. |
| **Presence** | Ephemeral per-user state in a collab session: cursor position, selection range, active/inactive. Not persisted as Version rows. |
| **Edit operation** | Atomic change (insert/delete/replace) broadcast within a collab session before checkpoint. |
| **Checkpoint** | Collab session commits current buffer to Sync Store via `versions.insert`; the durable boundary between ephemeral and persistent. |
| **Collab agent** | Background service on each machine (part of the desktop client) that joins collab relay sessions and bridges the **mirror file**: local disk changes → ops upstream, remote ops → mirror writes. **Editor-agnostic** — nvim, VS Code, Zed, or any tool that edits the mirror path. |
| **Collab adapter** | Optional editor-specific plugin (VS Code extension, Neovim plugin) that talks to the Collab agent for **in-editor presence** (remote cursors) or faster-than-autowrite ops. Not required to pair in v0. |

Update existing **Live sync** entry to cross-reference: live sync propagates **checkpoints and external saves**; live collab is the **pre-checkpoint** shared buffer.

Add `_Avoid_` for Collab adapter: plugin (use **Collab adapter** or **Kitchen extension**), LSP bridge.

**Verify**: `grep -E 'Live collab|Collab [Ss]ession|Presence|Checkpoint|Edit operation|Collab agent|Collab adapter' GLOSSARY.md | wc -l` → ≥ 7

### Step 2: Add Live Collaboration section to CONTEXT.md

After the `## Pierre Merge` section, add `## Live collaboration` covering:

1. **Distinction**: Live sync ≠ live collab (one sentence each)
2. **Session model**: ephemeral `Collab session` on a `File`; participants need `write` via org **Role** (not a separate collab permission entity)
3. **Checkpoint rule**: only `versions.insert` durably changes file bytes; session ops are ephemeral until checkpoint
4. **Editor-agnostic pair (v0)**: each machine runs a **Collab agent** that watches the mirror file. Teammate A uses nvim; teammate B uses VS Code — no Kitchen plugins required; autowrite/autosave recommended for low latency.
5. **Communication out of scope**: voice/video/chat (Meet, Discord, phone) are external; Kitchen syncs file bytes only.
6. **Optional Collab adapters**: plugins add in-editor cursors later; they are not the pairing mechanism.
6. **Fork compatibility**: external save during active session → session must rebase or end; Pierre Merge still resolves multi-head
7. **Not a fourth entity**: sessions live in collab relay memory/Redis — implementation detail, not `files` table

**Verify**: `grep -c '## Live collaboration' CONTEXT.md` → 1

### Step 3: Update VISION.md success criteria

Add to "Success looks like":

- Two developers join a **collab session** on the same file — one in **Neovim**, one in **VS Code** — with no browser and no Kitchen plugins. Each machine's **Collab agent** bridges the mirror to the relay. They coordinate voice on Discord or a phone call; Kitchen handles edits only. On checkpoint, a single **version** inserts.

Add to "Constraints":

- **Collab is protocol, not entity**. Ephemeral session state must not become a fourth top-level Sync Store table.

Add to "Out of scope (for now)" if not already implied:

- Voice/video chat (integrate externally)
- CRDT/OT algorithm selection (deferred to implementation spike in plan 007)
- Built-in voice, video, or text chat
- Terminal sharing (shared live shell) — each dev runs their own terminal
- Required per-editor plugins — v0 uses **Collab agent** only; adapters optional later

**Verify**: `grep -c 'collab session' VISION.md` → ≥ 1

### Step 4: Fix introduction.md contradiction

Replace `docs/introduction.md:5` ("Realtime co-editing exists in Google Docs, not in your codebase") with language that positions Kitchen as bringing Google-Docs-style **live collab** to code **without** becoming an IDE — storage-first, checkpoint-to-version.

Update the three-ideas list to add a fourth bullet or extend bullet 3:

- **Live collab is a first-class mode** — pair programming in a shared session; checkpoints insert versions.

Link forward to `docs/concepts/live-collaboration.md` (created in plan 009) as "(coming in docs)" or wait — plan 009 creates it. For this plan, add link text: see Live Collaboration concept doc.

**Verify**: `grep 'not in your codebase' docs/introduction.md` → no matches

## Test plan

No runtime tests. Verification is grep-based (commands above).

## Done criteria

- [ ] `GLOSSARY.md` has Collaboration section with 5 new terms and updated Live sync cross-reference
- [ ] `CONTEXT.md` has `## Live collaboration` section honoring three-entity constraint
- [ ] `VISION.md` lists collab session success criterion and collab-is-protocol constraint
- [ ] `docs/introduction.md` no longer claims co-editing is impossible in Kitchen
- [ ] `plans/README.md` status row for 006 updated to DONE

## STOP conditions

- GLOSSARY or CONTEXT already contains conflicting collab definitions that contradict three-entity model — stop and report the conflict text.
- Introduction was already rewritten and grep patterns fail for unexpected reasons — read file and report.

## Maintenance notes

- All future docs must use **Live collab** vs **Live sync** precisely per GLOSSARY.
- Do not add `collab_sessions` to `files` table in schema docs without an explicit plan — sessions are ephemeral.
- Plan 007 depends on these terms; do not rename without updating downstream plans.