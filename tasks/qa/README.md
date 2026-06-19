# Code QA tasks — `web/src` refactor loop

Sequential refactor tasks from the **2026-06-18 code quality audit** (`plans/012`–`016`).

## Order

| # | Task | Plan | Delivers |
|---|------|------|----------|
| 001 | [shared-libs-errors](./001-shared-libs-errors.md) | 012 | `lib/errors`, `content`, `slugify`, save error UX |
| 002 | [convex-id-boundaries](./002-convex-id-boundaries.md) | 013 | Typed route IDs, fork without useEffect |
| 003 | [file-tree-query](./003-file-tree-query.md) | 014 | Single `listProjectTree` query |
| 004 | [settings-split](./004-settings-split.md) | 015 | Split SettingsView, FormAlert |
| 005 | [effects-state-dedup](./005-effects-state-dedup.md) | 016 | Merge preview, versionHeads, zustand/zod optional |

## Run the QA loop

```bash
./loop-qa.sh
KITCHEN_LOOP_MAX_ITER=5 ./loop-qa.sh   # capped
```

Inspect:

```bash
KITCHEN_LOOP_SERIES=qa node scripts/task-loop.mjs status
KITCHEN_LOOP_SERIES=qa node scripts/task-loop.mjs next
```

## Guidelines (enforced in agent prompt)

- Minimize `useEffect`, `try/catch`, type casts
- Maximize inference — avoid explicit return types on components
- Convex = data layer (no react-query / tRPC)
- zod: forms + route params; zustand: client UI state only

## Product loop (separate)

Tasks `001`–`014` in `tasks/` are **shipped**. Use `./loop.sh` only for new product work.