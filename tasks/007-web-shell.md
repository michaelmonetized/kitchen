# Task 007: Web App Shell

**Depends on:** 006-core-queries  
**Output:** `web/src/app/(app)/` layout and navigation

## Goal

Build the authenticated application chrome: sidebar, header, user menu, responsive layout. Establish Kitchen visual identity (not generic AI slop). Empty states ready for tree + editor.

## Done criteria

- [x] `web/src/app/(app)/layout.tsx` — sidebar + main content area
- [x] UserButton (Clerk) in header; org switcher placeholder
- [x] Navigation: Projects, Settings (admin), docs link to repo
- [x] Loading and error boundaries for Convex queries
- [x] Dark-friendly palette; distinctive typography (not Inter-only default)
- [x] `/app` shows project list from `projects.forUser` (cards or list)
- [x] Empty state CTA: "Create your first project" (wired in task 011)

## Steps

1. Design tokens in `web/src/app/globals.css` — CSS variables for Kitchen brand.

2. Components:
   - `web/src/components/shell/AppSidebar.tsx`
   - `web/src/components/shell/AppHeader.tsx`
   - `web/src/components/shell/ProjectList.tsx` — `useQuery(api.projects.forUser)`

3. Route structure:
   - `/app` — project picker
   - `/app/projects/[projectId]` — reserved for task 008
   - `/app/settings` — reserved for task 011

4. Use `useConvexAuth` + redirect if unauthenticated.

5. Show fork/sync status indicator placeholder in header (wired in task 010).

## Verify

```bash
cd web && npm run build
# Dev: visit /app signed in, see project list or empty state
```

## References

- `docs/clients/web-and-mobile.md`
- `VISION.md` — success criteria for web work