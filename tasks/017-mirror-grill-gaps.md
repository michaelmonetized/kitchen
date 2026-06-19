# Task 017: Mirror Grill Gaps

**Depends on:** 015-mirror-client (baseline spike)  
**Output:** Fork policy A, tree diff moves, soft delete — per grill session ADRs 0002–0003  
**Why:** Task 015 cleared basic roundtrip; launch gate requires policies locked in [`03-mirror-edge-cases.md`](../docs/gtm/grilling/03-mirror-edge-cases.md)

## Goal

Extend `@kitchen/mirror-client` and Convex so the mirror matches grill decisions:

1. **Fork A** — author's version bytes on disk; freeze remote until merge
2. **Tree diff (wide)** — `parentId`/`name` ↔ `fs.rename` both directions
3. **Soft delete** — `properties.deleted = "true"`; infinite retention; tree walks skip tombstones

## Done criteria

### Fork policy A

- [ ] Cloud→disk: when `file.forked`, write version bytes only if `authorUserId === session user`
- [ ] Cloud→disk: skip remote users' version inserts on forked files
- [ ] Tray/notify + deep link to web merge UI on fork
- [ ] Manual verify: two-user save → each machine keeps own bytes until merge

### Tree diff (ADR 0002)

- [ ] `fileId ↔ mirror path` map maintained per project
- [ ] WS metadata change (`parentId`/`name`) → `fs.rename` / `mkdir` (echo-suppressed)
- [ ] Local `mv` / mkdir → `files.updateMetadata` / `files.insert`
- [ ] Verify: local `mv` → web tree; web move → disk rename

### Soft delete (ADR 0003)

- [ ] `files.markDeleted` mutation (sets `properties.deleted = "true"`)
- [ ] `children`, `listProjectTree`, mirror subscription filter `deleted !== "true"`
- [ ] Local `rm` → tombstone row; cloud tombstone → diff removes disk path
- [ ] Versions for tombstoned file still fetchable by `fileId` (audit)
- [ ] Verify: `rm` locally → gone from live tree; history query still works

### Docs

- [ ] `property-syntax.md` documents `deleted` (done in grill)
- [ ] `packages/mirror-client/README.md` updated for fork/tree/delete

## References

- [`docs/adr/0002-mirror-tree-diff-moves.md`](../docs/adr/0002-mirror-tree-diff-moves.md)
- [`docs/adr/0003-soft-delete-property.md`](../docs/adr/0003-soft-delete-property.md)
- [`docs/gtm/grilling/03-mirror-edge-cases.md`](../docs/gtm/grilling/03-mirror-edge-cases.md)