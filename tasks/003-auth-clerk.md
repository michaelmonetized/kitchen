# Task 003: Auth (Clerk)

**Depends on:** 002-convex-schema  
**Output:** `web/src/middleware.ts`, `web/convex/users.ts`, Clerk webhook

## Goal

Authenticate users via Clerk. Sync Clerk identity into Convex `users` table. Protect private routes. Unauthenticated users see marketing pages only.

## Done criteria

- [x] Clerk middleware protects `(app)/` routes; marketing routes stay public
- [x] `web/convex/users.ts` has `users.upsertFromClerk` internal mutation
- [x] HTTP webhook `web/convex/http.ts` handles `user.created` / `user.updated` with signature verification
- [x] Convex functions use `ctx.auth.getUserIdentity()`; map to `users` row by email
- [x] Sign-in / sign-up pages render Clerk components
- [x] Signed-in user lands on `/app` (project list placeholder OK)

## Steps

1. Add `web/src/middleware.ts` with `clerkMiddleware` — protect `/app(.*)` only.

2. Route groups:
   - `web/src/app/(marketing)/page.tsx` — public landing stub
   - `web/src/app/(app)/app/page.tsx` — protected home
   - `web/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
   - `web/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`

3. Convex auth config in `web/convex/auth.config.ts` for Clerk JWT.

4. `users.upsertFromClerk({ clerkId, email, displayName })` — idempotent on email index.

5. Webhook route validates `CLERK_WEBHOOK_SECRET`; document setup in `web/README.md`.

6. Helper `web/convex/lib/session.ts`:
   ```ts
   export async function requireUser(ctx) { /* returns users.Doc */ }
   ```

## Verify

```bash
cd web && npm run build
# Manual: sign up in dev, confirm users row in Convex dashboard
```

## References

- `docs/clients/web-and-mobile.md` § Session model
- `docs/concepts/schema.md` § users table