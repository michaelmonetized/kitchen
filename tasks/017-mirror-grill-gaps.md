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

- [x] Cloud→disk: when `file.forked`, write version bytes only if `authorUserId === session user`
- [x] Cloud→disk: skip remote users' version inserts on forked files
- [x] Tray/notify + deep link to web merge UI on fork
- [x] Manual verify: two-user save → each machine keeps own bytes until merge

### Tree diff (ADR 0002)

- [x] `fileId ↔ mirror path` map maintained per project
- [x] WS metadata change (`parentId`/`name`) → `fs.rename` / `mkdir` (echo-suppressed)
- [x] Local `mv` / mkdir → `files.updateMetadata` / `files.insert`
- [x] Verify: local `mv` → web tree; web move → disk rename

### Soft delete (ADR 0003)

- [x] `files.markDeleted` mutation (sets `properties.deleted = "true"`)
- [x] `children`, `listProjectTree`, mirror subscription filter `deleted !== "true"`
- [x] Local `rm` → tombstone row; cloud tombstone → diff removes disk path
- [x] Versions for tombstoned file still fetchable by `fileId` (audit)
- [x] Verify: `rm` locally → gone from live tree; history query still works

### Docs

- [x] `property-syntax.md` documents `deleted` (done in grill)
- [x] `packages/mirror-client/README.md` updated for fork/tree/delete

## Verify

```bash
npm run build -w @kitchen/mirror-client
cd web && npm run build
cd web && npx convex dev --once
node scripts/mirror-smoke.mjs
```

## References

- [`docs/adr/0002-mirror-tree-diff-moves.md`](../docs/adr/0002-mirror-tree-diff-moves.md)
- [`docs/adr/0003-soft-delete-property.md`](../docs/adr/0003-soft-delete-property.md)
- [`docs/gtm/grilling/03-mirror-edge-cases.md`](../docs/gtm/grilling/03-mirror-edge-cases.md)