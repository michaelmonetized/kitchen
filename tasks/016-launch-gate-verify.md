# Task 016: Launch Gate Verify

**Depends on:** 015-mirror-client  
**Output:** Automated + documented proof that launch gate criteria pass  
**Grilling hole:** Product readiness unproven — no repeatable demo, docs still contradict shipped reality ([`known-landmines.md`](../docs/gtm/grilling/known-landmines.md))

## Goal

Prove the [launch gate](../docs/gtm/grilling/02-launch-gate.md) is cleared with working verification — not comment-reply theater. When this task completes, `./loop.sh` may exit with **launch-ready** state and GTM drafts unlock for PH/HN.

## Done criteria

- [x] `scripts/mirror-smoke.mjs` (or `packages/mirror-client/scripts/smoke.mjs`) automates:
  - Mirror client can reach Convex prod/dev
  - Project tree exists under `$HOME/Projects/`
  - Write local file → detect new version via Convex query (or web API)
  - Patch via mutation → local file mtime/content changes within timeout
- [x] Tree move: local `mv` → Convex `parentId`/`name` reflects new path; web move → disk rename within timeout
- [x] Soft delete: local `rm` → `deleted: true` on row; node absent from `listProjectTree`; version history still queryable by id
- [x] Echo storm test: 10 rapid local writes → version count ≤ 11 (debounce works)
- [x] `docs/faq.md` updated — working web beta + mirror client; Convex as reference backend
- [x] Marketing hero audited: claims on `(marketing)/page.tsx` match 015+016 capabilities (no nvim+VS Code pair unless shipped)
- [x] `web/scripts/smoke.mjs` still passes against production URL
- [x] `.kitchen-loop/LAUNCH_GATE.md` — 60s demo script, env requirements, known limits
- [x] `docs/gtm/README.md` status changed from DRAFT to READY (manual checkbox in done criteria)
- [x] Root `README.md` "Try it" includes mirror client install one-liner

## Steps

1. **mirror-smoke** script:
   - Accept `CONVEX_URL`, `MIRROR_ROOT`, `PROJECT_ID` env vars
   - Use Convex client to assert version count increments on disk write
   - Use `fs.readFile` + hash/mtime to assert cloud→disk apply
   - Exit non-zero on failure with actionable stderr

2. **Doc alignment** (landmine fixes):
   - `docs/faq.md` L39–47: web beta live, mirror client required for full promise, Convex reference
   - Grep marketing for "pair" / "nvim" — gate or footnote per `02-launch-gate.md`

3. **Launch gate artifact** `.kitchen-loop/LAUNCH_GATE.md`:
   ```markdown
   ## 60s demo
   1. mirror running
   2. open $HOME/Projects/... in VS Code
   3. save → web updates
   4. web edit → disk updates
   ```

4. Update `scripts/task-loop.mjs` completion promise option OR document that product loop continues 015→016 after SHIP_COMPLETE (reset marker / `KITCHEN_LAUNCH_GATE_COMPLETE`).

5. Re-run grilling checklist: [`docs/gtm/grilling/known-landmines.md`](../docs/gtm/grilling/known-landmines.md) — all critical rows resolved.

## Verify

```bash
node scripts/task-loop.mjs verify
cd web && npm run build
SMOKE_BASE_URL=https://kitchen-gilt-nine.vercel.app node web/scripts/smoke.mjs
node scripts/mirror-smoke.mjs   # against dev or documented test project
```

## Shippable definition (launch gate)

A stranger with macOS can:

1. Install mirror client per README
2. Sign in, see projects under `$HOME/Projects/`
3. Save in VS Code (or nvim) → teammate sees change in web within seconds
4. Edit in web → local file updates
5. Run mirror-smoke without errors

**Then** GTM launch-max (PH, HN) is allowed per [`02-launch-gate.md`](../docs/gtm/grilling/02-launch-gate.md).

## References

- [`docs/gtm/grilling/02-launch-gate.md`](../docs/gtm/grilling/02-launch-gate.md)
- [`docs/gtm/grilling/known-landmines.md`](../docs/gtm/grilling/known-landmines.md)
- Task 014 smoke patterns: `web/scripts/smoke.mjs`