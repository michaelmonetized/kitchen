# Task 014: Ship Product

**Depends on:** 013-landing-marketing  
**Output:** Deployed, testable, shippable web product

## Goal

Deploy `./web` to Vercel with Convex production deployment. Smoke tests pass. A stranger can sign up, create a project, edit a file, see live sync, and merge a fork. This is the loop stop condition.

## Done criteria

- [ ] Vercel project linked to `web/`; production deploy succeeds
- [ ] Convex production deployment configured; env vars set in Vercel
- [ ] Clerk production instance wired (or dev keys documented for beta)
- [ ] `web/package.json` has `ship` or `deploy` script
- [ ] `web/scripts/smoke.mjs` — automated smoke test (Playwright or fetch-based) covering sign-in → create project → save file
- [ ] `AGENTS.md` at repo root — loop + gx + task conventions for future agents
- [ ] `node scripts/task-loop.mjs verify` passes
- [ ] README updated with "Try it" URL and demo video placeholder

## Steps

1. Vercel:
   ```bash
   cd web && vercel link
   vercel env pull
   ```

2. Convex prod:
   ```bash
   npx convex deploy
   ```

3. Env checklist in `web/.env.example` — every key documented.

4. Smoke test `web/scripts/smoke.mjs`:
   - Hit health route
   - Optional: Playwright sign-in test with test user

5. Root `AGENTS.md`:
   - Read `tasks/README.md` first
   - Product in `./web`
   - Kitchen invariants
   - `gx` / `./loop.sh` usage

6. Update root `README.md` status from "design phase" to "web beta" with live URL.

7. Write `.kitchen-loop/SHIP.md` with deploy URL, test credentials location, known limitations.

## Verify

```bash
node scripts/task-loop.mjs verify
cd web && npm run build
# Run smoke against production URL:
SMOKE_BASE_URL=https://your-app.vercel.app node web/scripts/smoke.mjs
```

## Shippable definition

A user can:
1. Visit landing page and understand the product
2. Sign up
3. Create org + project
4. Create and edit a file with version history
5. See another tab receive live updates
6. Merge a fork via the merge UI

When all above work in production, this task is complete and the build loop may exit.

## References

- `docs/clients/overview.md` — build order Phase 2 complete
- `VISION.md` — success criteria