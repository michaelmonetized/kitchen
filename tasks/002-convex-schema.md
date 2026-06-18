# Task 002: Convex Schema

**Depends on:** 001-web-scaffold  
**Output:** `web/convex/schema.ts`

## Goal

Implement the Sync Store schema exactly as specified in `docs/concepts/schema.md`: `users`, `roles`, `user_roles`, `files`, `versions`. No extra top-level entities. No `collab_sessions` table.

## Done criteria

- [x] `web/convex/schema.ts` defines all five tables with indexes from schema doc
- [x] Parent invariants documented in `web/convex/lib/invariants.ts` (org `parentId: null`, project parent = org)
- [x] `files.properties` is `v.record(v.string(), v.string())`
- [x] `versions.content` is `v.bytes()`; no `updatedAt` on versions
- [x] `files.forked` boolean required; `currentVersionId` optional
- [x] `npx convex dev --once` / `npx convex codegen` succeeds

## Steps

1. Copy the reference schema from `docs/concepts/schema.md` § Convex reference schema into `web/convex/schema.ts`.

2. Add indexes:
   - `users.by_email`
   - `roles.by_org` on `["orgFileId", "name"]`
   - `user_roles.by_user`, `by_role`
   - `files.by_parent` on `["parentId", "name"]`
   - `versions.by_file` on `["fileId"]`

3. Create `web/convex/lib/types.ts` exporting TS types for File, Version, Role.

4. Add `web/convex/lib/parentRules.ts`:
   - `assertOrg(file)` — `type === "dir" && parentId === undefined`
   - `assertProject(file, orgId)` — `type === "dir" && parentId === orgId`
   - `assertUnderProject(file, projectId)` — walk ancestors

5. Seed script stub `web/convex/seed.ts` (disabled in prod) for local dev.

## Verify

```bash
cd web && npx convex codegen && npm run build
```

## References

- `docs/concepts/schema.md`
- `docs/architecture/data-model.md`
- `CONTEXT.md` — three entities only