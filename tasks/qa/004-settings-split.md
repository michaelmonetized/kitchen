# Task 004: Split SettingsView + FormAlert + inferred types

**Plan:** [plans/015-qa-settings-split.md](../../plans/015-qa-settings-split.md)  
**Depends on:** 001-shared-libs-errors

## Goal

Break up 695-line SettingsView; use `FunctionReturnType` for org context; centralize error UI.

## Done criteria

- [x] `SettingsView.tsx` under 120 lines (shell + tabs only)
- [x] `OrganizationTab.tsx`, `MembersTab.tsx`, `RolesTab.tsx` extracted
- [x] `FormAlert.tsx` shared component
- [x] Org context type from Convex `FunctionReturnType`, not hand-written duplicate
- [x] All mutation handlers use `getErrorMessage` — no copy-pasted try/catch blocks
- [x] `cd web && npm run build` passes

## Verify

```bash
cd web && npm run build
wc -l src/components/settings/SettingsView.tsx
```