# Task 002: Convex ID boundaries + fork without useEffect

**Plan:** [plans/013-qa-convex-id-boundaries.md](../../plans/013-qa-convex-id-boundaries.md)  
**Depends on:** 001-shared-libs-errors

## Goal

Parse route IDs at page boundary; pass `Id<"files">` to components; return `forked` from `versions.insert`; remove fork-detection useEffect.

## Done criteria

- [x] `web/src/lib/convex-id.ts` — `parseFileId` / `parseProjectId`
- [x] Project/file/merge pages call `notFound()` on invalid IDs
- [x] `FileEditor`, `MergeView`, `FileTree` take typed `Id<"files">` props (no `as Id<>` inside)
- [x] `versions.insert` returns `{ forked: boolean }`
- [x] FileEditor fork modal opens from `save()` result — only 1 `useEffect` left (keyboard shortcut)
- [x] `cd web && npm run build` passes

## Verify

```bash
cd web && npm run build
grep -c "useEffect" src/components/editor/FileEditor.tsx  # expect 1
grep -rn 'as Id<"files">' src/components/editor src/components/merge src/components/tree || true
```