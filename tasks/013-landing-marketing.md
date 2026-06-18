# Task 013: Landing & Marketing

**Depends on:** 012-collab-relay  
**Output:** Public marketing site + onboarding polish

## Goal

Ship a marketable first impression: clear value prop for the novel model (storage, sync, work, collaboration), pricing placeholder, social proof section, CTA to sign up.

## Done criteria

- [ ] `/` (marketing) explains four layers + three modes with diagrams
- [ ] Hero CTA → `/sign-up`; secondary → docs link
- [ ] Feature sections: live sync, human merge, editor-agnostic pair
- [ ] "No git" positioning without attacking git unfairly
- [ ] Responsive mobile layout
- [ ] Meta tags, OG image, favicon, product name (Kitchen codename OK with disclaimer)
- [ ] Authenticated app feels cohesive with marketing (shared design tokens)
- [ ] First-run onboarding after sign-up (create org or join)

## Steps

1. `web/src/app/(marketing)/page.tsx` — full landing (not a stub).

2. Pull copy from `docs/the-kitchen-way.md` and `VISION.md` — compress for marketing.

3. Optional mermaid or SVG diagram: cloud rows → mirror → editors.

4. `web/src/app/(marketing)/pricing/page.tsx` — "Coming soon" or free tier beta.

5. `web/public/og.png` — simple branded image.

6. Connect onboarding wizard from task 011 to post-sign-up redirect.

## Verify

```bash
cd web && npm run build
# Lighthouse pass on / (performance reasonable, a11y basics)
```

## References

- `docs/the-kitchen-way.md`
- `VISION.md`
- `README.md`