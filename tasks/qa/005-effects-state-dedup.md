# Task 005: Effects cleanup + convex dedup + optional zustand/zod

**Plan:** [plans/016-qa-effects-convex-dedup.md](../../plans/016-qa-effects-state-dedup.md)  
**Depends on:** 002, 003, 004

## Goal

Remove MergeView preview useEffect; dedupe `getVersionHeads` in Convex; optionally add zustand (settings UI) and zod (forms). **Do not add react-query or tRPC.**

## Done criteria

- [x] `MergeView` / `MergeLinePicker` — no useEffect for preview sync
- [x] `convex/lib/versionHeads.ts` — single implementation
- [x] Total `useEffect` in `web/src` ≤ 4 (collab lifecycle, stale detect, keyboard shortcut, onboarding gate)
- [x] (Optional) `zustand` for settings tab + selectedOrgId if added to package.json
- [x] (Optional) `zod` for onboarding/settings form validation
- [x] `cd web && npm run build && npx tsc --noEmit` pass

## Verify

```bash
cd web && npm run build && npx tsc --noEmit
grep -rn "useEffect" src | wc -l
grep -rn "getVersionHeads" convex/
```