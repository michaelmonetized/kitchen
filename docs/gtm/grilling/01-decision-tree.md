# Master Decision Tree

Classify any launch comment in ~10 seconds, then jump to the platform file.

```
                          ┌─────────────────┐
                          │  New comment    │
                          └────────┬────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
             ┌──────────┐  ┌──────────┐  ┌──────────┐
             │  GLAZER  │  │ SKEPTIC  │  │ BAD-FAITH│
             │ praise   │  │ question │  │ dunk     │
             └────┬─────┘  └────┬─────┘  └────┬─────┘
                  │             │             │
                  │      ┌──────┴──────┐      │
                  │      ▼             ▼      │
                  │  ┌────────┐  ┌─────────┐  │
                  │  │GENUINE │  │COMPARER │  │
                  │  │curious │  │vs X     │  │
                  │  └───┬────┘  └────┬────┘  │
                  │      │            │       │
                  ▼      ▼            ▼       ▼
              [PH-GLZ] [PH/HN-Q]  [PH-CMP] [HN-DUNK]
```

## §1 — Classify (pick ONE primary)

| Signal | Type | Go to |
|--------|------|-------|
| "Love this" / "Finally" / "Take my upvote" / emoji-only praise | **Glazer** | PH: [G1–G3](./product-hunt-comments.md#glazers) · HN: rare, treat as G1 |
| "How is this different from X?" / "Isn't this just Y?" | **Comparer** | [PH-C1–C6](./product-hunt-comments.md#comparers) · [HN-C1–C8](./hacker-news-comments.md#comparers) |
| "Does it do Z?" / "What about offline?" / technical detail | **Genuine skeptic** | [PH-S1–S5](./product-hunt-comments.md#skeptics) · [HN-S1–S6](./hacker-news-comments.md#skeptics) |
| Sarcasm, "lol", "solution looking for problem", no question | **Bad-faith** | [Playbook §Hater](./00-response-playbook.md#hater-playbook-absorb-the-valid-hit) — one reply max |
| "Your FAQ says…" / cites doc contradiction | **Landmine** | [known-landmines.md](./known-landmines.md) → honest correction |
| Feature request | **Builder** | Acknowledge → in scope / out of scope → link VISION if out |
| Security / ACL concern | **Serious** | Technical reply → offer DM → never dismiss |

## §2 — Branch by intent

```
IF landmine cited (FAQ, marketing overclaim)
  → Acknowledge doc drift OR confirm limit
  → State what's true TODAY
  → Link fix PR if already filed
  → STOP — do not argue

ELSE IF comparer (names competitor)
  → X is great at [___]
  → Kitchen optimizes for [___]
  → You'd pick X when [___]
  → You'd pick Kitchen when [___]
  → Optional: 60-sec try link

ELSE IF glazer
  → Specific thanks
  → One micro-ask (try flow X)
  → NEVER ask for upvote/share

ELSE IF genuine skeptic
  → C.L.E.A.R. reply
  → If you don't know: "Haven't tested that yet"
  → Ask what threshold would convince them

ELSE IF bad-faith
  → Extract valid slice (if any)
  → One paragraph max
  → Do not reply again in subthread
```

## §3 — Platform tone shift

| Dimension | Product Hunt | Hacker News |
|-----------|--------------|-------------|
| Length | 3–6 sentences | 1–4 paragraphs OK if dense |
| Emoji | 📌 in maker post only; sparing in replies | None |
| Links | OK | OK but HN prefers substance over link-dropping |
| Humor | Light, warm | Dry; self-deprecating > defensive |
| "Beta" | Expected | Required honesty |
| Technical depth | Medium | High — they will read your schema |

## §4 — Response priority queue (launch day)

```
Priority 1: Comments with traction (3+ upvotes)
Priority 2: Comparers (sets narrative)
Priority 3: Landmines (credibility)
Priority 4: Genuine questions (no upvotes yet)
Priority 5: Glazers (convert to testers)
Priority 6: Bad-faith (one reply, move on)
```

## §4b — "No git" challenge (canonical expansion)

When anyone reads "no git" as "no history":

```
→ "No git" means mutations are just tracked on save
→ Never spend brain cells on: add | commit | push | pull | rebase
→ History = insert-only version rows
→ Merge = line-pick when forks diverge (not git merge)
→ STOP — do not argue further in thread unless they ask a follow-up
```

Full copy in [`01-messaging-core.md`](../01-messaging-core.md) § "No git — expanded".

## §5 — Archetype index

### Product Hunt → [product-hunt-comments.md](./product-hunt-comments.md)

| ID | Archetype |
|----|-----------|
| G1 | Pure hype glazer |
| G2 | "I've been waiting for this" |
| G3 | Influencer drive-by |
| C1 | vs Git / GitHub |
| C2 | vs Dropbox / Drive / Syncthing |
| C3 | vs VS Code Live Share |
| C4 | vs Google Docs / OT |
| C5 | vs Convex / "another Convex app" |
| C6 | vs Caffeine-style "how is this different from OG" |
| S1 | "Where's the desktop client?" |
| S2 | "No git import = dead on arrival" |
| S3 | Pricing / business model |
| S4 | Security / ACL |
| S5 | "Codename cringe" |
| H1 | "Misleading marketing" |
| H2 | "AI slop / vaporware" |

### Hacker News → [hacker-news-comments.md](./hacker-news-comments.md)

| ID | Archetype |
|----|-----------|
| C1 | vs git (strongest HN thread) |
| C2 | vs Syncthing / Dropbox |
| C3 | vs Live Share / CRDT editors |
| C4 | vs event sourcing / Datomic |
| C5 | vs Forgejo / git hosting |
| S1 | Offline / partition tolerance |
| S2 | Large monorepo / binary scale |
| S3 | Merge without auto-three-way |
| S4 | Convex dependency |
| S5 | ACL on file properties |
| S6 | "Show HN but no desktop = not real" |
| H1 | "Solution looking for problem" |
| H2 | FAQ / doc contradiction callout |
| H3 | "Pierre dependency = not built" |
| B1 | Deep technical builder (reward with depth) |