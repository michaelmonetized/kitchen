# Plan 007: Document live collaboration architecture and protocol

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: Read `GLOSSARY.md` and confirm plan 006 terms exist (`Live collab`, `Collab session`, `Checkpoint`). If missing, STOP — run plan 006 first.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/006-live-collab-vocabulary.md
- **Category**: direction
- **Planned at**: greenfield, 2026-06-18

## Why this matters

Pair programming requires an **ephemeral coordination layer** on top of insert-only versions: shared buffers, presence, ordered operations, and checkpoint boundaries. Without a written protocol, implementers will either (a) insert a version on every keystroke (destroying history semantics) or (b) build a fourth persisted entity (violating architecture). This plan specifies the collab relay contract and how it composes with the existing Sync Store.

## Current state

- `docs/architecture/overview.md` — diagram shows WebSocket to Sync Store; no collab relay
- `docs/concepts/sync-model.md` — events are `version.insert`, `file.*`; no session/presence/op events
- `docs/reference/event-catalog.md` — same gap
- `docs/concepts/schema.md` — `versions.insert` is the only content mutation; no session APIs
- `docs/architecture/versioning.md` — fork policy assumes independent saves, not in-session ops

Excerpt from `docs/concepts/sync-model.md:32-41` (existing events only):

```
| Event | Payload | Client action |
| `version.insert` | New Version row | Write content to mirror if file is current |
```

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| New arch doc exists | `test -f docs/architecture/live-collaboration.md && echo ok` | ok |
| Event catalog updated | `grep -c 'session\.\|presence\.\|op\.' docs/reference/event-catalog.md` | ≥ 3 |
| Sync model link | `grep 'live-collaboration' docs/concepts/sync-model.md` | ≥ 1 match |
| Schema API section | `grep -c 'collab' docs/concepts/schema.md` | ≥ 2 |
| No fourth entity table | `grep -i 'collab_sessions' docs/concepts/schema.md` | no matches |

## Scope

**In scope**:
- `docs/architecture/live-collaboration.md` (create)
- `docs/reference/event-catalog.md`
- `docs/concepts/sync-model.md`
- `docs/architecture/overview.md` (diagram update)
- `docs/concepts/schema.md` (API surface additions — mutations/queries, not new tables)
- `docs/architecture/versioning.md` (checkpoint + fork interaction section)

**Out of scope**:
- Choosing OT vs CRDT algorithm (document as open spike)
- Implementation code
- `GLOSSARY.md` (plan 006)
- Client UI details (plan 008)

## Steps

### Step 1: Create docs/architecture/live-collaboration.md

Write a self-contained architecture doc with these sections:

#### Layer diagram (mermaid)

```
Clients ↔ Collab Relay (ephemeral) ↔ Sync Store (durable)
                ↓ checkpoints only
           versions.insert
```

#### Components

| Component | Owns | Persists? |
|-----------|------|-----------|
| **Sync Store** | users, roles, files, versions | Yes |
| **Collab Relay** | sessions, presence, op log | No (ephemeral; TTL on idle) |
| **Collab agent** | per-machine background service; mirror watch ↔ relay ops | No |
| **Collab adapters** (optional) | per-editor plugins for in-editor presence | No |

**v0 requirement:** editor-agnostic pair via **Collab agent** on each machine. Relay speaks ordered ops or Yjs updates — spike decides. No browser, no required plugins.

#### Collab session lifecycle

```
1. User A opens file, starts session (requires write on File)
2. Relay creates session { sessionId, fileId, baseVersionId, participants: [A] }
3. User B joins (same write check)
4. Ops broadcast: op.insert | op.delete | op.replace with session sequence numbers
5. Presence broadcast: cursor line/col, selection, userId, displayName
6. Checkpoint triggers versions.insert(mergedBuffer) — on: manual, debounce (e.g. 30s), session end, max ops
7. Pointer advances; version.insert + file.pointer events fan out (existing sync)
8. Session ends or idles out (TTL)
```

#### Checkpoint rules (load-bearing)

- **One checkpoint ≠ one keystroke**. Default debounce 10–30s or explicit "Save checkpoint".
- Checkpoint content = relay's authoritative session buffer (server-side or elected leader — mark as implementation choice).
- `baseVersionId` must equal `currentVersionId` at session start; if pointer moves externally, session enters `stale` state → rebase from new current or end session.
- Two checkpoints from same session without external fork → linear (v_n, v_n+1).
- Checkpoint during active external edit → may fork; Pierre Merge unchanged.

#### Authorization

- Join/start session: same `canWrite(user, file)` as `versions.insert` (from `docs/concepts/permissions.md`).
- Read-only users may **observe** session (presence + buffer read) if product allows — document as optional `observe` capability tied to `read` role.

#### Editor-agnostic participation (v0)

```
┌──────────┐  read/write   ┌──────────────┐  WebSocket   ┌─────────────┐
│ Any      │◄─────────────►│ Collab agent │◄────────────►│ Collab relay│
│ editor   │  mirror file  │ (background) │              │   (cloud)   │
└──────────┘               └──────────────┘              └──────┬──────┘
  nvim, VS Code, Zed…                                            │ checkpoint
                                                                 ▼
                                                          versions.insert

External: Discord / Meet / phone (not Kitchen)
```

| Participant | v0 path | Notes |
|-------------|---------|-------|
| Any mirror editor | Collab agent watches file → ops | Enable autowrite/autosave for responsive sync |
| Web (optional) | Direct relay binding | No mirror |
| Optional plugin | localhost → agent | In-editor cursors only; plan 011 |

**During active session on file F:** Collab agent converts mirror changes to `collab.applyOp`; solo `versions.insert` from sync engine is **redirected** to agent path. Remote ops write mirror with echo suppression.

**Not in scope:** voice, video, text chat, terminal/shell sharing. Users communicate externally.

#### Open questions (explicit)

| Question | Lean for v0 |
|----------|-------------|
| OT vs CRDT | **Yjs** as default spike (VS Code + Neovim bindings exist); relay syncs Yjs update blobs |
| Max session duration | 4h idle TTL |
| Binary files in collab | Text only v0; binary = observe-only |
| Hub transport | Unix domain socket macOS/Linux; named pipe Windows |

Link to related docs.

**Verify**: `wc -l docs/architecture/live-collaboration.md` → ≥ 120 lines

### Step 2: Extend event catalog

Add new section `## Collab events (ephemeral channel)` to `docs/reference/event-catalog.md`:

| Event | Payload | Notes |
|-------|---------|-------|
| `session.start` | sessionId, fileId, baseVersionId, hostUserId | Relay → participants |
| `session.join` | sessionId, userId | |
| `session.leave` | sessionId, userId | |
| `session.end` | sessionId, reason | |
| `presence.update` | sessionId, userId, cursor, selection | High frequency; not persisted |
| `op.apply` | sessionId, seq, op, authorUserId | Ordered application |
| `session.stale` | sessionId, newCurrentVersionId | External version moved pointer |
| `checkpoint.pending` | sessionId | Optional UX: about to insert |
| `checkpoint.complete` | sessionId, versionId | After versions.insert |

Note: collab events use a **separate WebSocket channel or namespace** from project subscription — document this.

**Verify**: `grep -E 'session\.|presence\.|op\.' docs/reference/event-catalog.md | wc -l` → ≥ 6

### Step 3: Update sync-model.md

Add section `## Live collaboration vs live sync` after subscription model:

- Table contrasting latency, durability, events
- Pointer: collab ops update editor buffers live; mirror receives relay ops via hub/bridge; **checkpoint** is the durable `versions.insert`
- Link to `../architecture/live-collaboration.md`
- Link to `../clients/collab-agent.md` (plan 008)

**Verify**: `grep 'Live collaboration' docs/concepts/sync-model.md` → ≥ 1

### Step 4: Update architecture overview diagram

Add **Collab Relay** node between clients and Sync Store in mermaid diagram. Add data flow subsection "Pair programming checkpoint" with 6-step numbered list.

**Verify**: `grep -i 'collab' docs/architecture/overview.md | wc -l` → ≥ 2

### Step 5: Extend schema.md API surface

Add subsection `## Collab API (ephemeral — not tables)`:

| Call | Behavior |
|------|----------|
| `collab.startSession(fileId)` | Returns sessionId; validates write |
| `collab.joinSession(sessionId)` | Adds participant |
| `collab.leaveSession(sessionId)` | Removes participant; checkpoint if last writer leaves (policy) |
| `collab.applyOp(sessionId, op)` | Broadcast; relay orders |
| `collab.updatePresence(sessionId, presence)` | Broadcast only |
| `collab.checkpoint(sessionId)` | `versions.insert` + end or continue session |

Explicit note: **No `collab_sessions` table in Sync Store schema.** Relay storage is implementation-specific.

Update subscriptions table to mention collab channel separately from project scope.

**Verify**: `grep 'collab\.' docs/concepts/schema.md | wc -l` → ≥ 5; `grep 'collab_sessions' docs/concepts/schema.md` → no matches

### Step 6: Update versioning.md

Add section `## Checkpoints from collab sessions`:

- Checkpoint = version insert like any other save
- Session does not exempt from fork detection
- Multiple participants ≠ multiple simultaneous checkpoints without coordination — relay serializes checkpoints (one in flight per session)

**Verify**: `grep -i checkpoint docs/architecture/versioning.md` → ≥ 2 matches

## Test plan

Documentation-only. All verification via grep/test commands above.

## Done criteria

- [ ] `docs/architecture/live-collaboration.md` exists with lifecycle, checkpoint rules, layer diagram
- [ ] Event catalog documents ≥ 6 collab events on ephemeral channel
- [ ] `sync-model.md`, `overview.md`, `schema.md`, `versioning.md` updated and cross-linked
- [ ] No `collab_sessions` (or similar) table added to schema
- [ ] `plans/README.md` status row for 007 updated to DONE

## STOP conditions

- Plan 006 glossary terms missing — STOP, run 006 first.
- Existing `docs/architecture/live-collaboration.md` with incompatible model — STOP and report contents.

## Maintenance notes

- Implementation spike (OT vs CRDT) should be a separate plan after 007 lands.
- If Convex is chosen, collab relay may be a separate service — do not force into Convex mutations for high-frequency ops.
- Reviewers: ensure checkpoint debounce is documented — never one version per keystroke.