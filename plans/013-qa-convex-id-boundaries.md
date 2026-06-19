# Plan 013: Convex ID boundaries + fork modal without useEffect

> **Planned at**: commit `dec3b4b`, 2026-06-18
> **Depends on**: plans/012-qa-shared-libs-errors.md
> **Maps to task**: `tasks/qa/002-convex-id-boundaries.md`

## Status

- **Priority**: P1 | **Effort**: M | **Risk**: MED | **Category**: tech-debt

## Why this matters

Route params are `string` cast to `Id<"files">` at 20+ call sites. `FileEditor` uses refs + `useEffect` to detect fork after save because `versions.insert` returns nothing useful.

## Current state

- `web/src/components/editor/FileEditor.tsx:79-86` — fork detection effect
- `web/src/app/(app)/app/projects/[projectId]/files/[fileId]/page.tsx` — passes raw strings
- `web/convex/versions.ts` — `insert` mutation

## Scope

**In scope:**
- `web/src/lib/convex-id.ts` (zod or manual parse)
- App router pages under `projects/[projectId]/` and `settings`
- `FileEditor.tsx`, `MergeView.tsx`, `FileTree.tsx` — accept `Id<"files">` props
- `web/convex/versions.ts` — return `{ forked: boolean }` from insert

**Out of scope:** `listProjectTree`, Settings split

## Steps

### Step 1: `parseFileId(raw: string): Id<"files"> | null` in `lib/convex-id.ts`

Use zod if adding dep in task 005; for this plan a tight regex + `notFound()` in pages is OK.

### Step 2: Server pages parse IDs; pass typed props to client components

Use `notFound()` when parse fails.

### Step 3: `versions.insert` returns `{ forked: boolean }`; FileEditor branches in `save()` callback

Remove `awaitingForkCheckRef`, `forkedBeforeSaveRef`, and fork `useEffect`.

**Verify**: `grep -c "useEffect" web/src/components/editor/FileEditor.tsx` → 1 (keyboard shortcut only)

## Done criteria

- [ ] No `as Id<"files">` in FileEditor/MergeView/FileTree props (casts only inside parser)
- [ ] Fork modal triggered from save callback, not useEffect
- [ ] `cd web && npm run build` exit 0