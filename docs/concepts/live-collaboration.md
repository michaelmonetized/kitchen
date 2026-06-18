# Live Collaboration

**Live collab** lets two or more people edit the same file simultaneously. It is not the same as **live sync**. This page explains the distinction and how pair programming works in Kitchen.

Primary reference: [Live Collaboration architecture](../architecture/live-collaboration.md).

## Live sync vs live collab

| | Live sync | Live collab |
|---|-----------|-------------|
| What moves | `version.insert` rows | **Edit operation** stream |
| Speed | Seconds | Sub-second (with autowrite) |
| Durability | Immediate | At **checkpoint** only |
| Channel | Project WebSocket | Collab relay |

Live sync propagates checkpoints and solo saves. Live collab is the shared buffer *before* checkpoint.

## Collab session

A **Collab session** is an ephemeral room on one **File**, anchored to a base **Version**. It is not a Sync Store table — the collab relay holds session state in memory.

Participants need `write` via org **Role**, same as inserting a version.

## Presence

**Presence** (cursor position, selection) is ephemeral session state. It is not stored as **Version** rows. Without optional plugins, you see partner **edits** in the file but not their cursor inside your editor.

## Checkpoints

Only **checkpoints** create durable **Versions**. A checkpoint calls `versions.insert` with the session's merged buffer — typically on debounce (30s), explicit save, or session end. Not every keystroke.

## Fork during session

If someone outside the session solo-saves the same file, the session may go **stale** (`session.stale` event). Rebase from the new current version or end the session. **Pierre Merge** still resolves multi-head if a checkpoint forks.

## Collab agent

Each machine runs a **Collab agent** (background service) that bridges the **Mirror** file to the collab relay. Neovim on one side, VS Code on the other — no browser, no required plugins.

Details: [Collab Agent](../clients/collab-agent.md).

## Autowrite

The agent watches the mirror **on disk**. Enable autowrite (nvim) or autosave (VS Code) for responsive pairing.

## Communication

Kitchen does not include voice, video, or chat. Coordinate on Discord, Meet, or a phone call. Kitchen syncs file bytes only.

## Op redirect

During an active session, mirror changes become `collab.applyOp` — not direct `versions.insert`. The agent redirects solo sync for that file until the session ends.

## Quick checklist for pairing

Before a session:

- [ ] Kitchen desktop client running (Collab agent active)
- [ ] Both users have `write` on the file
- [ ] Autowrite (nvim) or autosave (VS Code) enabled
- [ ] Voice coordination ready (Discord, Meet, phone — external)

During a session:

- [ ] `kitchen pair start` / `kitchen pair join`
- [ ] Edits flow via ops, not solo version inserts
- [ ] Checkpoint before leaving or on debounce

Kitchen does not provide voice chat, video, or shared terminals. Each person runs their own shell against the synced mirror.

## Related

- [Pair Programming Walkthrough](../guides/pair-programming-walkthrough.md)
- [Sync Model](./sync-model.md)
- [Versioning](../architecture/versioning.md)
- [Desktop Sync](../clients/desktop-sync.md)
- [Collab Agent](../clients/collab-agent.md)