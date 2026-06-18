# Pair Programming Walkthrough

Alice and Bob pair on `utils.ts` — Alice in **Neovim**, Bob in **VS Code**. No browser, no Kitchen plugins. They're on a Discord call (external).

**Prerequisites:** [Live Collaboration](../concepts/live-collaboration.md), [Collab Agent](../clients/collab-agent.md)

## Cast

| Actor | Editor | Setting |
|-------|--------|---------|
| **Alice** | Neovim | `set autowriteall` |
| **Bob** | VS Code | `files.autoSave: afterDelay` 300ms |
| **File** | `src/utils.ts` — base version **v4** |

Both have Kitchen desktop client with **Collab agent** running.

## Timeline

### T+0 — Join session

```
Alice:  kitchen pair start src/utils.ts
        → sessionId: sess-abc, relay active

Bob:    kitchen pair join sess-abc
        → Collab agents on both machines connected
```

Tray shows: `utils.ts — pair session (2 participants)`.

### T+1 — Live edits

Alice adds a helper function in nvim. Autowrite flushes to mirror. Alice's agent diffs → `collab.applyOp`. Bob's mirror updates; VS Code reloads or shows new bytes within ~300ms.

Bob renames a variable. Same path in reverse. Alice sees the change in nvim.

Neither machine called `versions.insert` directly — ops only.

### T+2 — Checkpoint

Bob runs `kitchen pair checkpoint` (or 30s debounce fires):

```
Relay: versions.insert(fileId, mergedContent) → v5
Sync Store: version.insert event
Both mirrors: already at v5 bytes (agents kept them current)
Pointer: v5, forked: false
```

### T+3 — External solo save (optional)

Charlie (not in session) solo-edits `utils.ts` from his machine → v6 inserts. Relay sends `session.stale` to Alice and Bob. They rebase session from v6 or end and restart.

## What did not happen

| | |
|---|---|
| Browser tab opened | No |
| VS Code extension installed | No |
| Voice chat in Kitchen | No — Discord call |
| Version per keystroke | No — checkpoint only |

## Retrieval check

1. What bridges nvim and VS Code without plugins? *(Collab agent on each machine)*
2. What creates v5? *(Checkpoint → versions.insert)*
3. Where does voice coordination happen? *(External — Discord, not Kitchen)*

## Related

- [Concurrent Edit Walkthrough](./concurrent-edit-walkthrough.md) — independent saves + fork
- [Exercises](../exercises.md) — live collab section