# Task 020: Offline Save Queue (Notion-on-phone)

**Depends on:** 015-mirror-client, 017-mirror-grill-gaps (fork A)  
**Grill Q8:** Offline = save until reconnect, then merge  
**ADR:** [`0006-offline-save-until-reconnect.md`](../docs/adr/0006-offline-save-until-reconnect.md)

## Goal

When WebSocket to Convex drops, the mirror **does not block** local editor saves. Queued inserts flush on reconnect; conflicts become forks (merge in web).

## Done criteria

- [x] Durable local insert queue (survives daemon restart) under `~/.kitchen/queue/` or equivalent
- [x] Offline: FS watcher → queue entry (path, bytes hash, timestamp); disk write proceeds
- [x] Reconnect: flush queue in FIFO order → `versions.insert` per entry
- [x] Post-flush: if `forked`, apply Fork policy A (author bytes on disk; notify merge)
- [x] Tray state: `Synced` / `Offline (N queued)` / `Syncing…`
- [x] `docs/clients/desktop-sync.md` + FAQ offline section aligned with ADR 0006
- [x] Manual verify: disconnect network → edit file → reconnect → version in Convex; optional fork if remote also edited

## Out of scope

- CRDT / automatic merge on reconnect
- Offline tree moves (parentId/name) — v0 may queue content-only; document limitation

## Verify

```bash
# With mirror running, block Convex (or airplane mode):
# 1. Edit tracked file, save in editor
# 2. Tray shows queued count
# 3. Restore network
# 4. npx kitchen changes path/to/file --since <before-edit>
#    → new version row appears
```

## References

- [`docs/gtm/grilling/03-mirror-edge-cases.md`](../docs/gtm/grilling/03-mirror-edge-cases.md) E8