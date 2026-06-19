# Plan 015: Split SettingsView + shared FormAlert + inferred org types

> **Planned at**: commit `dec3b4b`, 2026-06-18
> **Depends on**: plans/012-qa-shared-libs-errors.md
> **Maps to task**: `tasks/qa/004-settings-split.md`

## Status

- **Priority**: P2 | **Effort**: M | **Risk**: MED | **Category**: tech-debt

## Why this matters

`SettingsView.tsx` is ~695 lines with 9 duplicate try/catch blocks and hand-written `OrgContext` type.

## Steps

### Step 1: `type OrgContext = FunctionReturnType<typeof api.admin.getOrgContext>` (non-null)

Use Convex `FunctionReturnType` from `convex/server` or helper.

### Step 2: Extract `components/settings/OrganizationTab.tsx`, `MembersTab.tsx`, `RolesTab.tsx`

Keep `SettingsView.tsx` as thin shell (~80 lines).

### Step 3: `components/ui/FormAlert.tsx` + use `getErrorMessage` everywhere

**Verify**: `wc -l web/src/components/settings/SettingsView.tsx` < 120

## Done criteria

- [ ] SettingsView < 120 lines
- [ ] No hand-written OrgContext interface duplicating Convex shape
- [ ] `grep -c "try {" web/src/components/settings/*.tsx` minimal (0 in tabs if using wrapper)