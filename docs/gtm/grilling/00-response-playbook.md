# Response Playbook — Mog Without Being Cringe

How to win upvotes on Product Hunt and Hacker News without sounding like a brand account or a defensive founder.

## The two audiences in every thread

| Type | What they want | Your job |
|------|----------------|----------|
| **Glazer** | Validation + social proof they picked right | Thank specifically, ask one sharp question, invite them to try one concrete flow |
| **Hater** | To be right, or to farm karma dunking on hype | Acknowledge the valid slice, correct one misconception, offer evidence — never match energy |
| **Comparer** | A decision matrix (you vs X) | Name what X optimizes for vs what Kitchen optimizes for; don't claim universal superiority |
| **Builder** | Technical truth | Stack facts, limits, and architecture; they'll upvote honesty over polish |

## Upvote mechanics (what actually gets karma)

**On Product Hunt:** Maker replies that get upvotes are **specific, helpful, and fast** in the first 4 hours. "Thanks!" dies. "Good question — here's the exact flow…" wins.

**On Hacker News:** Upvotes go to comments that **add information** — technical detail, personal experience, graceful correction. "Disagree" without substance gets flagged or ignored.

## Tone formula (C.L.E.A.R.)

| Letter | Rule | Example |
|--------|------|---------|
| **C** | Confirm you read them | "You're right that the desktop mirror isn't shipped yet." |
| **L** | Limit scope | "Kitchen optimizes for live sync, not release trains." |
| **E** | Evidence | "Two-tab demo: sign up → create project → save in tab A → tab B updates." |
| **A** | Ask back (genuine only) | "What sync latency would make this usable for your team?" |
| **B** | Bridge to docs | Link to `docs/concepts/permissions.md` only when they asked |

## Never do these (instant credibility loss)

- "We're disrupting git" / "git killer"
- Argue with every negative comment (looks fragile)
- Copy-paste the same reply 20 times (PH penalizes; HN notices)
- Hide beta limits — HN **will** find `docs/faq.md` saying "no working app" if you don't fix doc drift first
- Promise roadmap dates you can't hit
- Dunk on commenters ("you clearly don't understand…")
- Ask for upvotes (HN rule violation; PH looks desperate)

## Glazer playbook (convert hype → signal)

```
[Specific thanks] + [one thing you learned from them] + [micro-ask]
```

**Bad:** "Thanks so much!! 🙏🙏"

**Good:** "Appreciate this — 'Google Drive for code' is exactly the mental model we're testing. If you try the two-tab sync, curious whether the latency feels 'Drive-like' or still 'web app' to you."

Glazers are **distribution**. Treat them as early testers, not applause.

## Hater playbook (absorb the valid hit)

```
[Acknowledge valid part] + [correct one wrong assumption] + [invite falsification]
```

**Bad:** "Actually you're wrong about everything."

**Good:** "Fair — marketing the `$HOME/Projects` mirror before the desktop client ships is confusing. Today the beta is web-only sync; mirror is the contract we're building toward. If the web two-tab demo doesn't convince you the model works, totally fair to wait."

Hatred often contains a **real bug in your positioning**. Fix the positioning in the reply, not the commenter.

## Comparer playbook (you vs X)

Always use this structure:

1. **What X is great at** (one sentence, sincere)
2. **What Kitchen optimizes for instead** (one sentence)
3. **When you'd pick X** (shows intellectual honesty — HN eats this up)
4. **When you'd pick Kitchen** (concrete scenario)

## Speed targets

| Window | Target |
|--------|--------|
| First 15 min after PH post | Reply to every comment |
| First 4 hours PH | Stay in thread; prioritize questions with 3+ upvotes |
| HN launch day | Check every 30–60 min; OP visibility matters |
| HN day 2 | Reply to technical threads even on old comments |

## Escalation

| Situation | Action |
|-----------|--------|
| Comment cites wrong fact about product | Correct once with link; don't thread-war |
| Same question 5× | Post one detailed reply, link it: "Expanded answer here ↑" |
| Security concern | Take seriously; "Here's how ACL enforces on insert" + offer DM |
| "Scam" / "VC bait" | Calm facts + open source / live URL + honest beta limits |
| Feature request you won't build | "Out of scope by design — here's why" + link VISION constraints |