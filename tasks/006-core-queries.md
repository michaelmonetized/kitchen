# Task 006: Core Queries

**Depends on:** 005-core-mutations  
**Output:** `web/convex/queries.ts` (or split modules)

## Goal

Expose reactive queries for the web UI. Convex subscriptions replace custom WebSocket fan-out for v0.

## Done criteria

- [x] `files.children(parentId)` — authorized children only
- [x] `files.get(fileId)` — single file with auth check
- [x] `files.resolvePath(projectId, pathSegments[])` — file id from logical path
- [x] `versions.list(fileId, limit?)` — newest first via `_creationTime`
- [x] `versions.get(versionId)` — content + metadata
- [x] `projects.forUser()` — authorized project roots for session user
- [x] `orgs.forUser()` — org roots user belongs to
- [x] All queries call `canRead` before returning data

## Steps

1. `projects.forUser`:
   - List org roots user has any role in
   - List project dirs under those orgs where user has read via properties

2. `files.children`:
   - Query `by_parent` index
   - Filter each child with `canRead`

3. `versions.list`:
   - `by_file` index, order desc
   - Return metadata without full bytes in list (optional `includeContent` flag)

4. Add `files.getWithContent(fileId)` — joins current version bytes for editor open.

5. Document query names in `web/convex/README.md` mapping to `docs/reference/event-catalog.md` semantics.

## Verify

```bash
cd web && npm run build
# Convex dashboard: run projects.forUser with test user
```

## References

- `docs/concepts/schema.md` § queries/subscriptions
- `docs/concepts/sync-model.md`