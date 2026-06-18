# Plan 012: Shared web libs + error handling + navigation fixes

> **Executor instructions**: Follow step by step. Run every verification command.
> **Drift check**: `git diff --stat dec3b4b..HEAD -- web/src`
> **Planned at**: commit `dec3b4b`, 2026-06-18

## Status

- **Priority**: P0
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Maps to task**: `tasks/qa/001-shared-libs-errors.md`

## Why this matters

`FileEditor` swallows save errors (`try/finally` only). Settings repeats `err instanceof Error` 9×. `slugify` and text encoding are duplicated. `OnboardingWizard` calls `router.replace` during render. `MergeView` uses `window.location.href` after commit.

## Current state

- `web/src/components/editor/FileEditor.tsx:60-68` — no catch on save
- `web/src/components/settings/SettingsView.tsx:12-17` — `slugify` duplicate
- `web/src/components/onboarding/OnboardingWizard.tsx:10-15` — same `slugify`
- `web/src/components/onboarding/OnboardingWizard.tsx:38-40` — render-time redirect
- `web/src/components/merge/MergeView.tsx:185` — full page reload
- Exemplar: `web/src/lib/merge/diffLinePick.ts` — pure helpers, inferred types

## Commands

| Purpose | Command | Expected |
|---------|---------|----------|
| Build | `cd web && npm run build` | exit 0 |
| Lint | `cd web && npm run lint` | exit 0 (warnings OK) |
| Typecheck | `cd web && npx tsc --noEmit` | exit 0 |

## Scope

**In scope:**
- `web/src/lib/errors.ts` (create)
- `web/src/lib/slugify.ts` (create)
- `web/src/lib/content.ts` (create) — `encodeTextContent(text): ArrayBuffer`
- `web/src/lib/env.ts` (create) — `isClerkConfigured()`
- `web/src/components/editor/FileEditor.tsx`
- `web/src/components/merge/MergeView.tsx`
- `web/src/components/onboarding/OnboardingWizard.tsx`
- `web/src/components/settings/SettingsView.tsx` (slugify import only)
- `web/src/components/providers.tsx`, `AppHeader.tsx`, auth pages (env helper)

**Out of scope:** Convex schema, FileTree, Settings split

## Steps

### Step 1: Create `lib/errors.ts`, `lib/slugify.ts`, `lib/content.ts`, `lib/env.ts`

`getErrorMessage(err: unknown, fallback?: string)` — no explicit return type (infer).

`encodeTextContent` must slice ArrayBuffer correctly (not shared `TextEncoder` buffer bug).

**Verify**: `cd web && npx tsc --noEmit`

### Step 2: FileEditor — catch + error state UI

Add `saveError` state; catch in `save()`; display banner. Use `getErrorMessage`.

**Verify**: `grep -n "finally" web/src/components/editor/FileEditor.tsx` shows catch before finally

### Step 3: OnboardingWizard — remove render-time `router.replace`

Rely on `OnboardingGate` effect; remove lines 38-40 branch.

**Verify**: `grep -n "router.replace" web/src/components/onboarding/OnboardingWizard.tsx` → no matches

### Step 4: MergeView — `useRouter().push` instead of `window.location`

**Verify**: `grep -n "window.location" web/src/components/merge/MergeView.tsx` → no matches

### Step 5: Replace duplicated slugify + use encodeTextContent in FileEditor/MergeView save paths

**Verify**: `grep -rn "function slugify" web/src/components` → no matches

## Done criteria

- [x] `cd web && npm run build` exit 0
- [x] `cd web && npx tsc --noEmit` exit 0
- [x] No `function slugify` in components
- [x] No `window.location` in MergeView
- [x] FileEditor has catch on save

## STOP conditions

- `versions.insert` signature changed — report before editing call sites