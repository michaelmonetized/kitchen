# Plan 016: Kill preview useEffect + convex versionHeads + optional zustand/zod

> **Planned at**: commit `dec3b4b`, 2026-06-18
> **Depends on**: plans/013, 014, 015
> **Maps to task**: `tasks/qa/005-effects-state-dedup.md`

## Status

- **Priority**: P2 | **Effort**: M | **Risk**: LOW | **Category**: tech-debt

## Why this matters

`MergeView` syncs preview via useEffect. `getVersionHeads` duplicated in convex. Settings UI state is local `useState` — zustand optional. zod for settings forms optional.

## Steps

### Step 1: MergeView — lift preview state; remove `MergeLinePicker` preview useEffect

### Step 2: `convex/lib/versionHeads.ts` — single export used by versions, collabRelay, queries

### Step 3 (optional if deps approved): `zustand` for settings `selectedOrgId` + `tab`; `zod` for invite/create forms

Do NOT add react-query or tRPC.

**Verify**: `grep -c "useEffect" web/src/components/merge/MergeView.tsx` → 0

## Done criteria

- [ ] `useEffect` count in `web/src` ≤ 4 (collab + keyboard shortcut + onboarding gate only)
- [ ] `getVersionHeads` defined once in convex
- [ ] `cd web && npm run build && npx tsc --noEmit` exit 0