# Task 008: Project Browser

**Depends on:** 007-web-shell  
**Output:** File tree UI at `/app/projects/[projectId]`

## Goal

Render the project file tree from File rows. Support expand/collapse, MIME icons, fork badge on files. Clicking a file opens the editor route.

## Done criteria

- [x] `/app/projects/[projectId]` loads project root via auth check
- [x] Recursive tree from `files.children` queries (lazy load per folder)
- [x] Shows `forked` badge on files when true
- [x] Create file / create folder actions (calls `files.insert`)
- [x] Rename and delete (metadata) actions for authorized users
- [x] Breadcrumb from root to current folder
- [x] Selecting file navigates to `/app/projects/[projectId]/files/[fileId]`

## Steps

1. `web/src/components/tree/FileTree.tsx`:
   - Convex `useQuery(api.files.children, { parentId })`
   - Keyboard navigation (arrow keys) optional but nice

2. `web/src/components/tree/FileTreeNode.tsx`:
   - Dir → expand; file → navigate
   - Icon by `mime` (typescript, json, image, generic)

3. Mutations wired:
   - New file dialog → `files.insert` + initial empty `versions.insert`
   - New folder → `files.insert(type: dir)`
   - Rename → `files.updateMetadata`

4. `web/convex/files.ts` — add `files.remove` or tombstone via `properties.deleted: "true"` (document choice).

5. Real-time: tree auto-updates when peer inserts (Convex reactivity).

## Verify

```bash
cd web && npm run build
# Dev: create nested folders, see live updates in second browser tab
```

## References

- `docs/concepts/files-and-versions.md`
- `docs/reference/event-catalog.md` — `file.insert`, `file.metadata`