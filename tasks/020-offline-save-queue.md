# Task 020: Offline — queue + tree reconcile (Q12 = C)

**Depends on:** 015-mirror-client, 017-mirror-grill-gaps (fork A, tree diff)  
**Grill Q8 + Q12:** Notion-on-phone content; **local tree free**; full tree diff on reconnect  
**ADR:** [`0006-offline-save-until-reconnect.md`](../docs/adr/0006-offline-save-until-reconnect.md)

## Goal

Offline: editor + filesystem unrestricted on disk. Reconnect: flush content queue + reconcile tree with Convex.

## Done criteria

### Content queue

- [x] Durable queue under `~/.kitchen/queue/` (survives daemon restart)
- [x] Offline saves → queue + disk write
- [x] Reconnect → FIFO `versions.insert` flush
- [x] Post-flush fork → Fork policy A + merge notify

### Tree reconcile (Q12 = C)

- [x] Offline `mv` / `rm` / `mkdir` allowed on disk; recorded in local tree state
- [x] Reconnect → diff disk tree vs Convex tree → `files.updateMetadata` / `files.insert` / `markDeleted`
- [x] Echo suppression during reconcile
- [x] Tray: `Synced` / `Offline (N queued)` / `Reconciling…`

### Docs

- [x] `desktop-sync.md` + FAQ aligned with ADR 0006

## Out of scope

- CRDT / auto-merge
- Ordering guarantees across multi-user offline tree edits (fork + human resolution)

## Verify

```bash
# Offline: edit file + mv path; reconnect
# → version insert + metadata patch in Convex
npx kitchen changes path/to/file --since <before>
```

## References

- [`03-mirror-edge-cases.md`](../docs/gtm/grilling/03-mirror-edge-cases.md) E8