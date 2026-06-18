# Three Modes of Work

Kitchen supports three distinct ways to change code. Confusing them causes wrong mental models — especially conflating **live sync** with **live collab**.

## Overview

```
                    ┌─────────────────────────────────────┐
                    │         Sync Store (durable)         │
                    │    files + insert-only versions      │
                    └─────────────────────────────────────┘
                           ▲           ▲           ▲
                           │           │           │
              ┌────────────┘           │           └────────────┐
              │                        │                        │
       Mode 1: SOLO              Mode 2: CONCURRENT        Mode 3: LIVE COLLAB
       live sync                 async fork                 pair session
              │                        │                        │
         save → insert          two inserts →           ops → checkpoint
         one head               two heads → merge         → insert
```

## Mode 1 — Solo live sync

**You:** one person, one machine (or multiple machines logged in as you).

**Flow:**

1. Edit file in any editor against the mirror
2. Save → desktop client → `versions.insert`
3. Other your devices receive `version.insert` over WebSocket
4. Mirrors update within seconds

**History:** linear (one head per file) unless something else creates a fork.

**Docs:** [Sync Model](./sync-model.md), [Solo Workday Walkthrough](../guides/solo-workday-walkthrough.md).

## Mode 2 — Async concurrent (fork + merge)

**You:** two or more people saving **independently** — not in a collab session.

**Flow:**

1. Alice and Bob both save `page.tsx` from the same starting version
2. Sync Store holds both inserts — v2a and v2b
3. File enters **forked** state; pointer unresolved
4. Either person opens **Pierre Merge**, picks lines, inserts merged version
5. Pointer advances; live sync propagates merge

**Kitchen never** rejects one save because the other "won." Divergence is normal.

**Docs:** [Concurrent Edit Walkthrough](../guides/concurrent-edit-walkthrough.md), [Versioning](../architecture/versioning.md).

## Mode 3 — Live collab (pair programming)

**You:** two or more people in an active **Collab session** on one file.

**Flow:**

1. Each machine's **Collab agent** joins the collab relay
2. Mirror changes → `collab.applyOp` (not direct `versions.insert` during session)
3. Remote ops write to peer mirrors (echo-suppressed)
4. **Checkpoint** → single `versions.insert`
5. Session ends or continues

**Editors:** any mirror editor (nvim + VS Code, no plugins). Enable autowrite/autosave.

**Voice:** external — Discord, Meet, phone. Kitchen does not build chat.

**Docs:** [Live Collaboration](./live-collaboration.md), [Collab Agent](../clients/collab-agent.md), [Pair Programming Walkthrough](../guides/pair-programming-walkthrough.md).

## Decision guide

| Situation | Mode |
|-----------|------|
| Working alone | Mode 1 — solo live sync |
| Teammate will save later, not pairing now | Mode 1 until fork, then Mode 2 |
| Pair programming on same file right now | Mode 3 — start collab session |
| Pair ended, continue solo | Back to Mode 1 |

## Common mistakes

| Mistake | Reality |
|---------|---------|
| "Live sync means we're pairing" | Pairing requires Mode 3 — collab session |
| "Checkpoint every keystroke" | Checkpoints are debounced or explicit — not per key |
| "Kitchen provides voice chat" | External tools only |
| "Collab session is a database table" | Ephemeral relay protocol — not a fourth entity |

## Related

- [The Kitchen Way](../the-kitchen-way.md)
- [Getting Started](../getting-started.md)
- [Quick Reference](../reference/quick-reference.md)