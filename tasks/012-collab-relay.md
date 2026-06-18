# Task 012: Collab Relay (Web)

**Depends on:** 011-org-admin  
**Output:** Web optional collab participant

## Goal

Wire the existing `packages/collab-protocol` and `packages/collab-relay` into the web stack. Web can join a pair session, stream ops, checkpoint → `versions.insert`. No fourth Convex entity.

## Done criteria

- [x] `web/` depends on `@kitchen/collab-protocol` (workspace link)
- [x] Collab relay runs as Node service or Vercel-adjacent WS (document deployment)
- [x] Web UI: "Start pair session" / "Join session" on file editor
- [x] Ops apply to in-memory buffer; presence shown (cursors optional)
- [x] Checkpoint calls Convex `versions.insert` via relay callback
- [x] `session.stale` handled when external save during session
- [x] Voice/chat not built — link tooltip "Use Discord/Meet for voice"

## Steps

1. Add relay server entry `web/server/collab-relay.ts` OR deploy `packages/collab-relay` separately; env `COLLAB_RELAY_URL`.

2. `web/src/components/collab/CollabPanel.tsx`:
   - Join by sessionId
   - Connect WebSocket to relay
   - Bridge Monaco onChange → `collab.applyOp`

3. Reuse spike patterns from `scripts/spike-pair.mjs` and `packages/collab-agent` (web equivalent: direct editor binding).

4. Checkpoint debounce (e.g. 2s idle) + manual "Checkpoint now" button.

5. Do **not** add `collab_sessions` Convex table — relay memory only.

## Verify

```bash
npm run build
npm run spike:pair  # existing spike still passes
cd web && npm run build
# Dev: two browsers join same session, edit, checkpoint → version row
```

## References

- `docs/clients/collab-agent.md`
- `docs/architecture/live-collaboration.md`
- `docs/concepts/live-collaboration.md`
- `packages/collab-protocol/src/index.ts`