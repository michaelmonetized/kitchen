# Task 026: Username onboarding + account + 301 redirects

**Depends on:** 003-auth-clerk, 024-account-parent-projects  
**Grill Q17–Q18:** Onboarding username; ugly slug OK for FOSS; immutable email; 301 chain
**ADR:** [`0014-username-onboarding-and-redirects.md`](../docs/adr/0014-username-onboarding-and-redirects.md)

## Goal

After Clerk sign-up → `/onboarding` (username only). Change at `/account/`. Username renames emit 301 chain (max 5 deep, then forget oldest).

## Done criteria

- [x] `/onboarding` — single username field; placeholder `{domain}-{localPart}` from Clerk email
- [x] Block app until onboarding complete (first session)
- [x] `/account/` — change username; **email read-only** + work-email warning
- [x] Accept placeholder as final username on onboarding submit (Q18 = C) — FOSS URLs use ugly slug until rename
- [x] `username_redirects`: 301 `/{old}/*` → `/{new}/*`; drop oldest after 5th rename; clear redirects when `old` reclaimed
- [x] Web middleware + Convex account mutations
- [x] Docs: ADR 0014, FAQ work-email warning

## Verify

```bash
# Sign up as mostlyalice@gmail.com → onboarding shows placeholder gmail.com-mostlyalice
# Rename at /account/ → curl -I kitchen.sync/mostlyalice/flakebed → 301 to new slug
```

## References

- [ADR 0013](../docs/adr/0013-project-namespace-and-urls.md)