# Task 003: FileTree single-query refactor

**Plan:** [plans/014-qa-file-tree-query.md](../../plans/014-qa-file-tree-query.md)  
**Depends on:** 002-convex-id-boundaries

## Goal

Replace per-folder `useQuery(children)` with one `listProjectTree` Convex query.

## Done criteria

- [x] `api.queries.listProjectTree` returns flat tree for a project
- [x] `FileTree.tsx` uses exactly one `useQuery`
- [x] No `as Doc<"files">[]` casts in FileTree
- [x] `cd web && npm run build` passes

## Verify

```bash
cd web && npm run build
grep -c "useQuery" src/components/tree/FileTree.tsx  # expect 1
```