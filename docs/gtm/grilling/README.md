# Launch Comment Grilling

Stress-test Kitchen GTM copy against the commenters who will actually show up — glazers, skeptics, comparers, and bad-faith drive-bys. Each file is a **decision tree**: read the comment archetype → pick the branch → paste the response variant.

**Grounded in:** real #1 PH maker threads (Open Caffeine comparison attacks, Mina skepticism), Show HN patterns (Fata, Kage), and Kitchen doc/code contradictions found during this session.

## Files

| File | Platform | Focus |
|------|----------|-------|
| [00-response-playbook.md](./00-response-playbook.md) | Both | Tone rules, upvote mechanics, what to avoid |
| [01-decision-tree.md](./01-decision-tree.md) | Both | Master tree — classify any comment in 10 seconds |
| [product-hunt-comments.md](./product-hunt-comments.md) | PH | Roasts + branches + copy-paste replies |
| [hacker-news-comments.md](./hacker-news-comments.md) | HN | Roasts + branches + copy-paste replies |
| [known-landmines.md](./known-landmines.md) | Both | Doc/code gaps commenters will weaponize |
| [02-launch-gate.md](./02-launch-gate.md) | Both | Ship blockers + mirror MVP |
| [03-mirror-edge-cases.md](./03-mirror-edge-cases.md) | Both | Fork/disk, git init, auth, macOS-only |
| [04-web-vision-roasts.md](./04-web-vision-roasts.md) | Both | Web ≠ editor; blame; textarea landmine |

## How to use on launch day

1. Classify comment using [01-decision-tree.md](./01-decision-tree.md) §1 (10 sec)
2. Open platform file → find matching archetype
3. Pick branch (genuine / comparer / bad-faith / glazer)
4. Paste **Recommended reply**, personalize one line
5. If comment surfaces a real gap → log in [known-landmines.md](./known-landmines.md)

## Grilling session status

| Round | Topic | Status |
|-------|-------|--------|
| 1 | Master decision tree + landmines | ✅ Written |
| 2 | PH comment archetypes (12) | ✅ Written |
| 3 | HN comment archetypes (14) | ✅ Written |
| 4 | "No git" positioning (Option A + expansion) | ✅ Locked — see `01-messaging-core.md` |
| 5 | Launch gate — no PH/HN until mirror promise true | ✅ Locked — see `02-launch-gate.md` |
| 6 | Mirror MVP — TS menubar/daemon + Convex realtime + FS watcher | ✅ Locked — `02-launch-gate.md`, ADR 0001 |
| 7 | Build tasks 015–016 for grilling holes | ✅ |
| 8 | Mirror edge cases (fork/disk, git init, macOS-only) | ✅ [`03-mirror-edge-cases.md`](./03-mirror-edge-cases.md) |
| 9 | Grill Q4 — fork **A**; tree **wide** (tree diff) | ✅ ADR 0002 |
| 10 | Grill Q5 — delete **A** (`deleted: true` prop, infinite retention) | ✅ ADR 0003 |
| 11 | Grill Q6 — web = diff/blame/ACL; no textarea; blame via version author | ✅ ADR 0004, task 018 |
| 12 | Grill Q7 — **no product AI**; `.kitchen/docs` + Convex CLI for harnesses | ✅ ADR 0005, task 019 |
| 13 | Grill Q8 — offline = **Notion on phone** (queue → reconnect → merge) | ✅ ADR 0006, task 020 |
| 14 | Grill Q9 — **`npx kitchen changes`** path `[--since instant]` | ✅ ADR 0007, task 021 |