# Kitchen GTM — Launch Posts

**Status: READY — launch gate cleared (mirror-smoke + doc alignment).**  
See [`grilling/02-launch-gate.md`](./grilling/02-launch-gate.md) and [`.kitchen-loop/LAUNCH_GATE.md`](../../.kitchen-loop/LAUNCH_GATE.md).

Go-to-market copy for Kitchen's first launch wave (ready when gate clears). Grounded in:

- [Launch Playbook](file:///Users/michael/Second%20Brain/Launch%20Playbook.md) — launch-max (hit every surface, repeat 3×)
- [Startup Launch Platforms](file:///Users/michael/Second%20Brain/Startup%20Launch%20Platforms.md) — platform map by stage

**Live URL:** [kitchen-gilt-nine.vercel.app](https://kitchen-gilt-nine.vercel.app)  
**Teaser video:** `launch-video/out/teaser.mp4`

## Files

| File | Purpose |
|------|---------|
| [00-writing-strategy.md](./00-writing-strategy.md) | Research synthesis from #1 launches (Apr–Jun 2026) |
| [01-messaging-core.md](./01-messaging-core.md) | Shared kernel — use on every platform |
| [product-hunt.md](./product-hunt.md) | PH tagline, description, maker comment |
| [hacker-news.md](./hacker-news.md) | Show HN title + first comment |
| [twitter-x.md](./twitter-x.md) | Launch thread + follow-up posts |
| [linkedin.md](./linkedin.md) | Founder post + comment reply templates |
| [indie-hackers.md](./indie-hackers.md) | IH product page + launch post |
| [devhunt.md](./devhunt.md) | DevHunt listing |
| [betalist.md](./betalist.md) | BetaList submission |
| [peerlist.md](./peerlist.md) | Peerlist launch |
| [micro-launch.md](./micro-launch.md) | MicroLaunch / TinyLaunch (short form) |

## Launch prerequisites

Do **not** execute wave 1 until:

1. **Mirror client** (TS menubar or background service) bidirectionally syncs Convex ↔ `$HOME/Projects` — see [`grilling/02-launch-gate.md`](./grilling/02-launch-gate.md), [ADR 0001](../adr/0001-mirror-client-typescript-convex.md)
2. Hero/marketing copy matches shipped surface
3. `docs/faq.md` aligned with production reality
4. Re-run [`grilling/`](./grilling/README.md) against what actually ships

## Launch order (wave 1 — after gate)

Per Launch Playbook **launch-max**, ship all of these in the same week:

1. **Day 0 (Tuesday–Thursday, 12:01 AM PT):** Product Hunt + Hacker News + Twitter thread
2. **Day 0–1:** LinkedIn video post, Indie Hackers, DevHunt
3. **Day 1–3:** BetaList, Peerlist, MicroLaunch, TinyLaunch
4. **Week 2–4:** Repeat wave 2 and wave 3 with new angle (desktop mirror demo, pair-programming spike, merge UI walkthrough)

## Comment grilling (launch day prep)

Simulated PH/HN roasts + response decision trees: [`grilling/`](./grilling/README.md)

- [ ] Fix [known landmines](./grilling/known-landmines.md) before launch (especially `docs/faq.md`)
- [ ] Rehearse comparer replies (git, Dropbox, Live Share)

## Before posting

- [ ] Attach teaser video or 30s screen recording (Launch Playbook: video ≈ 10× static)
- [ ] Confirm `kitchen-gilt-nine.vercel.app` smoke passes
- [ ] Pin codename disclaimer on PH and LinkedIn
- [ ] Queue warm outbound to LinkedIn likers (Launch Playbook play #3)