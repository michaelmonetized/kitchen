# Plan 008: Specify editor-agnostic pair programming via local Collab agent (v0)

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: Confirm `docs/architecture/live-collaboration.md` exists (plan 007). If missing, STOP.
>
> **Product decisions:**
> - 2026-06-18: Native cross-editor pair (nvim + VS Code, no browser). Policy A rejected.
> - 2026-06-18: Pair editing is **editor-agnostic** — a **Collab agent** background service on each machine handles relay ↔ mirror. Per-editor plugins are **optional** (in-editor cursors only), not required for v0.
> - Communication (voice/video) is **out of product scope** — users use phone, Meet, Discord, etc. Kitchen does not build chat or audio.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/007-live-collab-architecture.md
- **Category**: direction
- **Planned at**: greenfield, 2026-06-18

## Why this matters

Kitchen's mirror contract means every editor already reads/writes `$HOME/Projects`. Pair programming should leverage that: a **background Collab agent** joins the relay session and bridges the mirror file — no VS Code extension or nvim plugin required. Alice uses nvim, Bob uses VS Code, both edit the same mirrored path; the agent on each machine handles ops.

## Current state

- `docs/clients/desktop-sync.md` — watcher → `versions.insert` only; no collab agent
- Prior plan 008 revision required `kitchen.nvim` + `kitchen-vscode` — **superseded** by Collab agent model

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Collab agent doc | `test -f docs/clients/collab-agent.md && echo ok` | ok |
| Agent policy | `grep -c 'Collab agent\|collab.applyOp\|mirror' docs/clients/desktop-sync.md` | ≥ 3 |
| Editor-agnostic | `grep -i 'editor-agnostic\|any editor' docs/clients/collab-agent.md` | ≥ 2 |
| No required plugins | `grep -i 'required.*plugin\|required.*extension' docs/clients/collab-agent.md` | no matches |
| Comms out of scope | `grep -i 'discord\|meet\|voice\|audio' docs/clients/overview.md` | ≥ 1 in out-of-scope |
| No Policy A | `grep -i 'local-only\|open in browser' docs/clients/desktop-sync.md` | no matches |

## Scope

**In scope**:
- `docs/clients/collab-agent.md` (create)
- `docs/clients/overview.md`
- `docs/clients/desktop-sync.md`
- `docs/clients/web-and-mobile.md`

**Out of scope**:
- Per-editor plugins (optional future — plan 011)
- Voice, video, text chat, Discord/Meet integration
- **Terminal sharing** (sharing a live shell/REPL view to partner — see explanation in Step 1)
- GLOSSARY (plan 006)

## Steps

### Step 1: Create docs/clients/collab-agent.md

#### What the Collab agent is

A **background service** on each machine (part of the Kitchen desktop client). It:

1. Joins a **collab session** on the relay when user runs `kitchen pair join <file>` (CLI or tray)
2. **Watches** the mirrored file path for that session
3. On local disk change → compute diff → `collab.applyOp` (NOT `versions.insert`)
4. On remote `op.apply` → write bytes to mirror path (echo-suppressed)
5. On checkpoint → relay triggers `versions.insert`; agent confirms mirror matches
6. Exposes optional localhost status API (session info, participants) for tray UI

**Editor-agnostic:** nvim, VS Code, Zed, Xcode, IntelliJ — anything that reads/writes the mirror path works. No Kitchen plugin required.

#### Pairing story (v0 acceptance)

```
Alice (nvim)                    Bob (VS Code)
 edits mirror                   edits mirror
     │                               │
     ▼                               ▼
 Collab agent (Mac)            Collab agent (Win)
     │                               │
     └───────────┬───────────────────┘
                 ▼
           Collab relay (cloud)
      ops sync + periodic checkpoint
```

Alice and Bob talk on Discord (external). Kitchen handles file bytes only.

#### Autowrite requirement (load-bearing)

Most editors buffer in memory and flush to disk on save. The agent watches **the mirror file**, not editor memory.

| Editor | Recommended setting for live pair |
|--------|-----------------------------------|
| Neovim | `set autowrite` or `set autowriteall` |
| VS Code | `files.autoSave: afterDelay` (e.g. 300ms) |
| Zed | Enable autosave |

Without autowrite/autosave, pair editing still works but feels like **save-to-sync** (seconds of lag). Document this honestly — not a Kitchen bug.

#### Presence without plugins

| Capability | v0 without plugins | With optional editor plugin (future) |
|------------|-------------------|--------------------------------------|
| See partner's edits | ✓ (via mirror updates) | ✓ |
| See partner's cursor in editor | ✗ | ✓ |
| Tray shows "Bob is in session" | ✓ | ✓ |

In-editor remote cursors are **nice-to-have**, not v0.

#### Out of scope — communication vs terminal sharing

**Communication (voice/video/chat):** Kitchen does **not** build audio, video, or text chat. Users coordinate via phone, Google Meet, Discord, Slack huddle, or in person. This is intentional — Kitchen is storage and file sync, not a communications product.

**Terminal sharing:** This means sharing a **live shell session** so your partner sees your terminal output and can type commands (VS Code Live Share's "shared terminal"). That is **not** voice chat. Kitchen does **not** include terminal sharing in v0 — each developer runs their own terminal against the shared mirror. Do not conflate with voice/video.

#### Optional editor plugins (not v0)

Future `kitchen-vscode`, `kitchen.nvim` plugins may add in-editor cursors and faster-than-autowrite op capture. They talk to the same Collab agent via localhost — they **replace** watcher diff path for that editor, not a separate protocol.

**Verify**: doc ≥ 90 lines; editor-agnostic stated; comms + terminal sharing out of scope explained

### Step 2: Update desktop-sync.md

Merge Collab agent into desktop client architecture:

- **Sync engine** — mirror ↔ Sync Store (existing)
- **Collab agent** — mirror ↔ Collab relay during active session (new subsection)

Native collab v0 policy:

1. User starts/joins pair via tray or `kitchen pair`
2. Agent marks file `collab-session`; watcher events → diff → `collab.applyOp`
3. Remote ops → agent writes mirror (echo suppress)
4. Checkpoint → `versions.insert`
5. Session end → agent idle; watcher resumes solo `versions.insert`

**Verify**: `Collab agent` appears; no Policy A language

### Step 3: Update client capability matrix

| Feature | Desktop (Collab agent) | Web | Mobile |
|---------|------------------------|-----|--------|
| Live pair editing | **✓ any mirror editor** | Optional | Observe |
| Per-editor plugins | Optional (cursors) | N/A | N/A |
| Voice/video/chat | **Use external tools** | — | — |
| Terminal sharing | **Out of scope** | — | — |

### Step 4: Update web-and-mobile.md

Web may join as optional participant (same relay). Not required for pair programming.

### Step 5: Update build order

```
Phase 3: Collab relay + op stream spike
Phase 4: Collab agent in desktop client (mirror watch ↔ relay)
Phase 5: Pair CLI/tray (start, join, leave, status)
Phase 6: End-to-end test — nvim + VS Code, autowrite on, no plugins
Phase 7: Web optional participant
Phase 8: Pierre Merge
```

Remove required kitchen.nvim / kitchen-vscode phases from v0.

**Verify**: build order mentions Collab agent, not required plugins

## Done criteria

- [ ] `docs/clients/collab-agent.md` documents editor-agnostic model + autowrite + comms out of scope
- [ ] `desktop-sync.md` integrates Collab agent
- [ ] No doc requires per-editor plugins for v0 pair
- [ ] Terminal sharing vs voice clarified
- [ ] `plans/README.md` status row for 008 updated to DONE

## STOP conditions

- Plan 007 missing — STOP.

## Maintenance notes

- If autowrite latency is unacceptable in spike, plan 011 adds optional plugins — do not revert to Policy A or browser-only.
- "Live Share parity" in any doc means terminal/multi-file features — not voice. Voice is never in scope.