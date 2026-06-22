# Task 022: continue 018 web diff blame surface

**Auto-generated recovery task** — created because the web/cloud product loop stopped before completion.

## Goal

Resume 018-web-diff-blame-surface.md

## Done criteria

- [x] Recovery goal achieved
- [x] `npm run build` passes in `web/`
- [x] Original pending tasks unblocked or completed

## Steps

1. Complete 018-web-diff-blame-surface.md (10 criteria left)
2. Complete 019-agent-discovery-kit.md (6 criteria left)
3. Complete 020-offline-save-queue.md (7 criteria left)

## Verify

```bash
cd web && npm run build
KITCHEN_LOOP_SERIES=product node scripts/task-loop.mjs status
```
