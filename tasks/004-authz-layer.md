# Task 004: Authorization Layer

**Depends on:** 003-auth-clerk  
**Output:** `web/convex/lib/authz.ts`

## Goal

Implement server-side authorization per `docs/concepts/permissions.md`. Every mutation that inserts files or versions must call `canRead` / `canWrite`.

## Done criteria

- [x] `web/convex/lib/authz.ts` exports `canRead(ctx, userId, fileId)` and `canWrite(ctx, userId, fileId)`
- [x] Algorithm walks ancestor chain; merges `role:*` properties child-overrides-parent
- [x] `user_roles` scoped to org; optional `projectFileId` limits assignment
- [x] `denyByDefault` — no matching role property → deny
- [x] Unit tests or `web/convex/lib/authz.test.ts` with ≥3 scenarios (editor write, viewer read-only, wrong org deny)
- [x] `getAuthorizedProjects(userId)` returns project roots user can read

## Steps

1. Implement property merge walking `files` from leaf to org root.

2. Load `user_roles` for user where role's `orgFileId` matches file's org.

3. Match `role:<name>` keys:
   - `write` grants read+write
   - `read` grants read only

4. `getOrgForFile(fileId)` — walk parents until `parentId === undefined`.

5. Export `assertCanWrite(ctx, fileId)` throwing `ConvexError("FORBIDDEN")`.

## Verify

```bash
cd web && npm run build
# Run authz tests if added: npm test
```

## References

- `docs/concepts/permissions.md`
- `docs/reference/property-syntax.md`