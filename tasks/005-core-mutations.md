# Task 005: Core Mutations

**Depends on:** 004-authz-layer  
**Output:** `web/convex/files.ts`, `web/convex/versions.ts`, `web/convex/roles.ts`

## Goal

Implement insert-only Sync Store mutations. Content changes **only** via `versions.insert`. Enforce authorization on every call.

## Done criteria

- [x] `files.insert` — create org (`parentId: null`), project, folder, or file; validates parent rules
- [x] `files.updateMetadata` — rename, move, properties; never touches content
- [x] `versions.insert` — append version; updates pointer when linear; sets `forked: true` on concurrent heads
- [x] `files.setCurrentVersion` — admin/merge flow pointer advance
- [x] `roles.insert`, `user_roles.insert` — org admin only
- [x] Forbidden paths absent: no `versions.patch`, no `files.updateContent`
- [x] Each mutation calls authz helpers before write

## Steps

1. **`files.insert`**
   - Args: `parentId`, `type`, `name`, `mime?`, `properties`
   - Validate sibling name uniqueness via `by_parent` index
   - Default `properties` to `{}`, `forked: false`

2. **`versions.insert`**
   - Args: `fileId`, `content` (as `ArrayBuffer` / bytes), `parentVersionIds?`
   - `assertCanWrite`
   - Insert version with `authorUserId`
   - Pointer policy (from `docs/architecture/versioning.md`):
     - If single head after insert → set `currentVersionId`
     - If multiple heads → `forked: true`, freeze pointer

3. **`files.updateMetadata`**
   - Patch `name`, `parentId`, `properties`, `updatedAt`
   - Re-validate parent rules on move

4. **`roles.insert` / `user_roles.insert`**
   - Require `admin` permission on org

5. Export internal helpers for pointer head detection.

## Verify

```bash
cd web && npx convex run seed:demo  # if seed exists
cd web && npm run build
```

## References

- `docs/concepts/schema.md` § API surface (mutations)
- `docs/architecture/versioning.md`
- `docs/reference/event-catalog.md`