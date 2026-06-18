# Task 001: Shared libs + errors + navigation fixes

**Plan:** [plans/012-qa-shared-libs-errors.md](../../plans/012-qa-shared-libs-errors.md)  
**Depends on:** none

## Goal

Extract shared `web/src/lib/*` helpers; fix silent save errors; remove render-time redirect and full-page reload.

## Done criteria

- [x] `web/src/lib/errors.ts` — `getErrorMessage` (inferred return type)
- [x] `web/src/lib/slugify.ts` — single `slugify`; removed from Settings + Onboarding
- [x] `web/src/lib/content.ts` — `encodeTextContent` with correct ArrayBuffer slice
- [x] `web/src/lib/env.ts` — `isClerkConfigured()`; used in providers + auth pages
- [x] `FileEditor` shows save errors; `catch` uses `getErrorMessage`
- [x] `OnboardingWizard` has no `router.replace` during render
- [x] `MergeView` uses `router.push` not `window.location`
- [x] `cd web && npm run build && npx tsc --noEmit` pass

## Steps

1. Create lib files per plan 012
2. Wire FileEditor, MergeView, OnboardingWizard, Settings (slugify import)
3. Replace Clerk placeholder checks with `isClerkConfigured()`

## Verify

```bash
cd web && npm run build && npx tsc --noEmit
grep -rn "function slugify" src/components || true
grep -n "window.location" src/components/merge/MergeView.tsx || true
```