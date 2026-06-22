# Offline — save until reconnect, then merge

Mirror behavior while disconnected matches **Notion on your phone**: the local editor keeps working; the daemon buffers work locally; on reconnect it **reconciles** with Convex. If the cloud moved while you were offline, you get a **fork** — same merge ceremony as live races (Pierre line-pick in web).

## Policy

| Phase | Behavior |
|-------|----------|
| **Online** | Normal bidirectional sync (WS + FS watcher + tree diff) |
| **Offline** | **Local tree is free** — save, `mv`, `rm`, `mkdir` on disk; content inserts + tree intent queued durably |
| **Reconnect** | Flush content queue → `versions.insert`; **full tree diff** disk ↔ Convex → metadata patches / tombstones; apply Fork policy A where needed |
| **Conflict** | Remote head advanced while offline → `forked: true`; merge in web |

No silent drop. No blocking the editor — the mirror is the buffer.

**Content:** queued version inserts, FIFO flush on reconnect.

**Tree (grill Q12 = C):** disk is source of truth while offline; daemon does not reject `mv`/`rm`/`mkdir`. On reconnect, diff local tree against last-known Convex tree (same engine as ADR 0002 wide tree diff) and apply inverse to cloud. Heavy fork possible if remote also moved tree — merge ceremony for content; tree conflicts surface in web.

**Considered:** Content-only queue, block tree ops offline — rejected; plane UX needs rename/delete.

**Considered:** Auto-merge on reconnect — rejected; merge is human (Kitchen invariant).

**Consequences:** Task [`020-offline-save-queue.md`](../../tasks/020-offline-save-queue.md).