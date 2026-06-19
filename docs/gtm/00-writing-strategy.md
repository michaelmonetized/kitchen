# GTM Writing Strategy

Synthesized from Product Hunt #1 daily winners (Apr 18 – Jun 18, 2026) and high-scoring Show HN posts. References: [Launch Playbook](file:///Users/michael/Second%20Brain/Launch%20Playbook.md), [Startup Launch Platforms](file:///Users/michael/Second%20Brain/Startup%20Launch%20Platforms.md).

## Sample set (#1 Product Hunt, past 60 days)

| Date | #1 | Tagline pattern |
|------|-----|-----------------|
| Jun 18 | Upstream | Category reframe — "inbox designed for humans **and** agents" |
| Jun 1 | Mina | Role upgrade — "AI Teammate **now** responds and executes" |
| May 15 | OpenHuman | Problem → fix list — "90% give up. Three reasons… OpenHuman fixes all of it" |
| May 24 | Stitch 3.0 (Google) | Verb + surface — "Generate and iterate UI screens on a live canvas" |
| Apr 21 | RankAI | Autonomy claim — "first SEO/GEO agent that **truly** works" |

Dev-tools standouts in top 10: **Open Caffeine** (#10, Jun 1), **Tabstack**, **Dune Keypad**, **Twenty 2.0**, **ModelHub**.

High-scoring Show HN (same window): **Kage** (703 pts), **Fata** (119 pts), **Inkwash** (243 pts).

## Common prose patterns

### 1. Tagline anatomy

Winners use one of four formulas:

| Formula | Example | Kitchen fit |
|---------|---------|-------------|
| **X for Y** | "Cursor for Product Managers" | "Google Drive for code — without git" |
| **Verb outcome** | "Keep your Mac awake" | "Live-sync your codebase to any editor" |
| **Unlike X, we Y** | "Unlike traditional meeting tools, Mina can speak during calls" | "Unlike git's async loop, Kitchen syncs in seconds" |
| **Finally / Stop** | "Finally, an inbox you'll look forward to" | "Stop treating disk as source of truth" |

**Rule:** Tagline ≤ 60 characters for PH title field. Subtitle carries the contrast.

### 2. Description structure (Product Hunt)

~90% of #1 descriptions follow this block order:

```
[Hook — 1 sentence, emotional or contrast]
[Problem — 1–2 sentences, "Most teams still…"]
[Solution — product name + what it does in plain language]
[Unlike X — explicit competitor or status-quo comparison]
[Capabilities — 3–5 concrete outcomes, not feature bullets]
[Credibility — stack, open source, beta honesty]
[CTA — implicit ("Drop in your website") or free tier]
```

**Prose habits:**

- Present tense, second person ("you save", "your team")
- Named tools (Slack, VS Code, Chrome) — specificity signals real product
- "Unlike" / "Not another" / "No more" — appears in 7/10 #1 descriptions
- Beta disclaimers when honest ("expect bugs") — builds trust, doesn't hurt votes

### 3. Maker first comment (Product Hunt)

Top dev-tool launches (Open Caffeine, Standboy, ModelHub) share:

1. **📌** or "Hey Product Hunt!" opener
2. **Origin** — "I built X because I wanted…" (personal, not corporate)
3. **Walkthrough** — 3–4 sentences on the happy path
4. **Audience ask** — "feedback from macOS users, developers, and…"
5. **No hard sell** — link is already on the page

### 4. Show HN structure

High performers (Fata, Kage-adjacent patterns) use:

```
Hi HN, I'm [name]. [Credibility / years / context].

[Motivation — what problem you hit personally]

[What it is — 1–2 sentences]

[Try it — link, prefer no-signup if possible]

[How it works — technical transparency, stack, architecture choices]

[Honest limits — what's not done yet]

[Ask — "Would appreciate feedback on X and Y"]
```

**HN tone:** Builder-to-builder. Less marketing adjectives. More "here's what I tried and why."

**Title format:** `Show HN: Kitchen – [specific capability, not tagline fluff]`

### 5. Cross-platform kernel

Every post shares the same **five beats**; only emphasis shifts:

| Beat | Core line |
|------|-----------|
| **Hook** | Your projects live in the cloud. Your editor sees them on disk. |
| **Contrast** | There is no git — mutations tracked on save; no `add` / `commit` / `push` / `pull` / `rebase`. |
| **Mechanism** | Files are DB rows; saves append versions; WebSockets fan out in seconds. |
| **Work** | Mirror at `$HOME/Projects` — nvim, VS Code, Zed, anything. |
| **Together** | Solo sync, async fork+merge (Pierre line-pick), or live pair via Collab agent. |
| **Teams** | Granular ACL — org roles, project-scoped assignment, `role:*` properties on files, inherited + server-enforced. |

Platform emphasis:

| Platform | Lead with | Avoid |
|----------|-----------|-------|
| Product Hunt | Outcome + delight | Schema jargon in tagline |
| Hacker News | Architecture + invariants | "Disrupting git" hype |
| Twitter/X | 10s video + one-liner | Wall of text |
| LinkedIn | Founder story + team pain + ACL for multi-project orgs | HN-level technical depth |
| Indie Hackers | Build journey + metrics | Pure pitch |
| DevHunt | Dev workflow + stack | Marketing fluff |
| BetaList | Waitlist value prop | Feature laundry list |

## What #1 launches avoid

- Vague "AI-powered" without naming what the AI does
- Feature lists without a "unlike X" anchor
- Passive voice and abstract nouns ("solution", "platform", "ecosystem")
- Hiding beta status — top launches disclose and ship fast

## Kitchen-specific constraints

1. **Codename** — say "Kitchen is a working title" once per post; never apologize twice.
2. **Not an IDE** — Kitchen is storage + sync; editors stay yours.
3. **Merge is human** — Pierre line-pick, not auto-merge. HN respects this honesty.
4. **Video first** — Launch Playbook play #5: attach demo clip on X, LinkedIn, PH gallery.

## Launch gate (policy)

**No public launch until the tagline is true:** cloud truth + editor sees files on disk at `$HOME/Projects`. Web-only beta is dogfood, not PH/HN. Details: [`grilling/02-launch-gate.md`](./grilling/02-launch-gate.md).

## Repeat launch angles (waves 2–3)

Per Launch Playbook, plan **three launches minimum**:

| Wave | Angle | Hero asset |
|------|-------|------------|
| 1 | "No git" cloud project store | Teaser video |
| 2 | Editor-agnostic pair programming | Collab spike screen recording |
| 3 | Pierre merge walkthrough | Fork → line-pick → checkpoint GIF |

Same five beats, new hook per wave.