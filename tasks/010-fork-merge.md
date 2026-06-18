# Task 010: Fork & Merge UI

**Depends on:** 009-file-editor  
**Output:** Pierre-style merge view (integrate or fallback diff)

## Goal

When `forked: true`, guide users to human merge. Side-by-side diff with line-pick composes merged content → `versions.insert` with `parentVersionIds`.

## Done criteria

- [x] Fork badge in tree and editor links to merge route
- [x] `/app/projects/[projectId]/files/[fileId]/merge` shows two version panes
- [x] User picks lines/blocks from left, right, or both (human merge)
- [x] Preview merged result before commit
- [x] Commit calls `versions.insert` with `parentVersionIds: [va, vb]`
- [x] On success: `forked: false`, pointer → merged version
- [x] If Pierre npm package unavailable, ship `diff` + line-pick fallback (document in code comment)

## Steps

1. `web/src/app/(app)/app/projects/[projectId]/files/[fileId]/merge/page.tsx`

2. `web/src/components/merge/MergeView.tsx`:
   - Fetch two head versions (or user-selected pair)
   - Render split diff (`diff` package or Pierre if integrated)
   - Line pick state machine → merged string

3. `web/convex/versions.ts` — `versions.insertMerge`:
   - Validates both parents are heads
   - Inserts with `parentVersionIds`
   - Clears fork, sets pointer

4. Modal on save when fork detected elsewhere: "Open merge view" per `docs/clients/web-and-mobile.md`.

5. Read `docs/reference/pierre-integration.md` — integrate if feasible; else TODO with attribution.

## Verify

```bash
cd web && npm run build
# Dev: insert two versions from dashboard, open merge UI, compose v3
```

## References

- `docs/architecture/versioning.md` § Merge workflow
- `docs/reference/pierre-integration.md`
- `docs/guides/concurrent-edit-walkthrough.md`