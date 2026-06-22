# Username — onboarding, immutability, 301 chain

Usernames power public URLs `/<username>/<project>` ([ADR 0013](./0013-project-namespace-and-urls.md)). **Email is immutable** — username is the public handle you can change.

## Q17 flow (D + onboarding nudge)

Username **only matters for public URLs**, but every new account completes a one-screen onboarding after Clerk sign-up:

```
/sign-up  →  Clerk  →  /onboarding  →  app
```

**`/onboarding`** — single field: **username**

| UI | Behavior |
|----|----------|
| Placeholder default | `{emailDomain}-{localPart}` from Clerk email |
| Example | `mostlyalice@gmail.com` → placeholder `gmail.com-mostlyalice` |
| Intent | Ugly default nudges immediate rename; user may keep it for private-only work |
| Submit | Sets account `username` slug; **accepting placeholder is allowed** (Q18 = C) |

Private work: ugly slug is fine. **FOSS / public** elevation works with the placeholder too — public URLs are literally `gmail.com-mostlyalice/flakebed` until the user renames at `/account/`; then **301s** preserve old links ([§301](#301-redirect-policy-username-renames)).

## Change username

Settings: **`/account/`** (e.g. `kitchen.sync/account/`) — change anytime.

**Email cannot change.** Copy on sign-up and account page:

> Don't sign up with your work email unless you must — you can't change it later, and you'll lose access when you leave that job.

## 301 redirect policy (username renames)

We maintain redirects — we're the VCS people; links should keep working.

On username change `old` → `new`:

1. Register **301** `/{old}/…` → `/{new}/…` (preserve path suffix)
2. Keep redirect chain while `old` is **not** claimed by a new account
3. If user renames **more than 5 times**, drop **301s for the oldest** former usernames (FIFO forget)
4. If a **new user claims** `old` as their username, **delete** redirects to that slug — new owner owns the namespace

Store: `username_redirects` table or edge config — `fromUsername`, `toUsername`, `createdAt`, `droppedAt`.

## Consequences

- Task [`026-username-onboarding.md`](../../tasks/026-username-onboarding.md) — `/onboarding`, `/account/`, 301 middleware
- Task 024 — account row `username` unique index
- GTM/sign-up: work-email warning