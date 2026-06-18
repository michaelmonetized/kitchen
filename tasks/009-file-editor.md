# Task 009: File Editor

**Depends on:** 008-project-browser  
**Output:** Monaco editor with save → `versions.insert`

## Goal

Edit text files in the browser. Save inserts a new version row (never overwrites). Show version history sidebar. Handle live updates from other sessions when buffer is clean.

## Done criteria

- [x] `/app/projects/[projectId]/files/[fileId]` opens Monaco editor
- [x] Load content from current version (`files.getWithContent`)
- [x] Save (Cmd+S) calls `versions.insert` with UTF-8 bytes
- [x] Dirty buffer warning before navigating away
- [x] Version history panel lists `versions.list` with timestamps + authors
- [x] Read-only mode for `viewer` role (no save)
- [x] Binary/non-text mime shows "open in desktop" placeholder, not Monaco

## Steps

1. Install `@monaco-editor/react`.

2. `web/src/components/editor/FileEditor.tsx`:
   - `useQuery` for file + current content
   - Local buffer state; track `isDirty`
   - `useMutation(api.versions.insert)` on save

3. `web/src/components/editor/VersionHistory.tsx`:
   - Click version → preview read-only (does not change pointer)

4. Handle remote updates:
   - If not dirty and `currentVersionId` changes via Convex, refresh buffer
   - If dirty, show toast "New version available" (no silent overwrite)

5. Toolbar: file name, mime, fork badge link (task 010), save status.

## Verify

```bash
cd web && npm run build
# Dev: edit file, save, confirm new version row in Convex dashboard
```

## References

- `docs/clients/web-and-mobile.md` § Editing flow
- `docs/concepts/sync-model.md`
- `docs/getting-started.md` — invariant 2 (insert-only)