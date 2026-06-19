# Offline — save until reconnect, then merge

Mirror behavior while disconnected matches **Notion on your phone**: the local editor keeps working; the daemon **queues** version inserts; on reconnect it **flushes** to Convex. If the cloud moved while you were offline, you get a **fork** — same merge ceremony as live races (Pierre line-pick in web).

## Policy

| Phase | Behavior |
|-------|----------|
| **Online** | Normal bidirectional sync (WS + FS watcher) |
| **Offline** | Local saves accepted; bytes stay on disk; inserts queued in daemon (durable local store) |
| **Reconnect** | Flush insert queue in order → `versions.insert` per queued save |
| **Conflict** | Remote head advanced while offline → `forked: true` after flush; Fork policy A on disk; merge in web |

No silent drop. No "save failed" modal blocking the editor — the mirror is the buffer, like a mobile app cache.

**Considered:** Fail loud on disconnect (block saves) — rejected; breaks plane/lid-close UX and contradicts mirror-as-view mental model.

**Considered:** Auto-merge on reconnect — rejected; merge is human (Kitchen invariant).

**Consequences:** Task [`020-offline-save-queue.md`](../../tasks/020-offline-save-queue.md). Launch gate (016) may still ship with "online assumed" until 020 lands; docs must not claim offline until verify passes.