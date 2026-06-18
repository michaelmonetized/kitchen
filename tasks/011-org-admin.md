# Task 011: Org Admin

**Depends on:** 010-fork-merge  
**Output:** `/app/settings` admin surfaces

## Goal

Org admins create orgs and projects, define roles, assign members. New teammate flow from `docs/guides/new-teammate-walkthrough.md`.

## Done criteria

- [x] `/app/settings` — org list for admin users
- [x] Create org → `files.insert(type: dir, parentId: null)` with `org:<slug>` property
- [x] Create project under org → `files.insert(type: dir, parentId: orgId)`
- [x] Role CRUD: `roles.insert` with permissions array
- [x] Invite flow: assign `user_roles` by email (upsert user stub or invite via Clerk)
- [x] Set file properties `role:editor: write` on project root (JSON `{"role:editor":"write"}`)
- [x] Transfer ownership UI (properties + role changes)
- [x] Non-admin users see read-only settings or 403

## Steps

1. `web/src/app/(app)/app/settings/page.tsx` — tabs: Organization, Members, Roles

2. Forms:
   - Create org (name, slug)
   - Create project (name, parent org)
   - Add member (email + role + optional project scope)

3. `web/convex/admin.ts` — wrapper mutations checking `admin` permission

4. On first sign-in: optional onboarding wizard creating personal org + sample project

5. Seed demo data updated for admin walkthrough.

## Verify

```bash
cd web && npm run build
# Dev: create org, project, second user, assign viewer — confirm read-only
```

## References

- `docs/guides/new-teammate-walkthrough.md`
- `docs/concepts/orgs-and-roles.md`
- `docs/clients/web-and-mobile.md` § Admin flows