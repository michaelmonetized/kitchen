# Plan 014: Flatten FileTree — single listProjectTree query

> **Planned at**: commit `dec3b4b`, 2026-06-18
> **Depends on**: plans/013-qa-convex-id-boundaries.md
> **Maps to task**: `tasks/qa/003-file-tree-query.md`

## Status

- **Priority**: P1 | **Effort**: M | **Risk**: MED | **Category**: perf

## Why this matters

`FileTreeNode` calls `useQuery(api.queries.children)` per folder — N+1 Convex subscriptions.

## Current state

```21:23:web/src/components/tree/FileTree.tsx
  const children = useQuery(api.queries.children, {
    parentId: fileId as Id<"files">,
  });
```

## Steps

### Step 1: Add `queries.listProjectTree` in `web/convex/queries.ts`

Return flat array: `{ _id, parentId, name, type, forked }[]` for one project root.

### Step 2: Refactor `FileTree.tsx` to build tree in memory from one `useQuery`

Remove per-node `useQuery`. Remove `children as Doc<"files">[]` casts.

**Verify**: `grep -c "useQuery" web/src/components/tree/FileTree.tsx` → 1

## Done criteria

- [ ] Single `useQuery` in FileTree
- [ ] `cd web && npm run build` exit 0