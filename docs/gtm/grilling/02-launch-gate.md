# Launch Gate — Decision

**Status:** Locked (grill session 2026-06-18)  
**Decision:** Do **not** run launch-max (PH, HN, IH, etc.) until the marketing promise is true.

## The promise we won't ship ahead of

From canonical messaging:

> **Your projects live in the cloud. Your editor sees them on disk.**

That means a user can open a file under `$HOME/Projects/<project>/` in their normal editor (nvim, VS Code, Zed, …), save locally, and Kitchen tracks the mutation (version insert + live fan-out) — not a browser textarea standing in for "your editor."

## Rejected alternatives (grill Q2)

| Option | Approach | Verdict |
|--------|----------|---------|
| A | Beta banner disclosing web-only | ❌ Ship messaging that admits the gap |
| B | Soften hero; demote mirror to "coming" | ❌ Launch on weakened promise |
| C | Ship as-is; own gap in comment replies | ❌ Invite "misleading" roasts we already simulated |

**Founder line:** *"None of the above — we don't ship this till that promise is true."*

## Mirror MVP (grill Q3 — locked)

**Shape:** TypeScript **Electron menubar app** *or* **headless background service** — same sync engine; menubar is optional tray/status chrome.

**Bidirectional loop (solo sync only for gate):**

```
┌─────────────────────────────────────────────────────────┐
│  Mirror client (TypeScript)                              │
├─────────────────────────────────────────────────────────┤
│  Cloud → disk                                            │
│    Convex live subscription (default realtime sync)      │
│    → on tree/version change → write $HOME/Projects/…   │
├─────────────────────────────────────────────────────────┤
│  Disk → cloud                                            │
│    FS watcher on mirror root                             │
│    → debounce + echo suppress                            │
│    → versions.insert mutation                            │
└─────────────────────────────────────────────────────────┘
```

No custom WebSocket layer for v0 — leverage Convex's built-in realtime. See [ADR 0001](../../adr/0001-mirror-client-typescript-convex.md).

**Out of scope for gate (ship after):** Collab agent, pair UI, Windows/Linux (macOS first for verify), offline queue (policy locked ADR 0006 — task 020), `kitchen changes` CLI (task 021).

## Launch criteria (minimum)

Before any public launch wave ([Launch Playbook](file:///Users/michael/Second%20Brain/Launch%20Playbook.md) play #1):

| # | Criterion | Verify |
|---|-----------|--------|
| 1 | **Mirror client installed** | Menubar or background service running |
| 2 | **Cloud → disk** | Edit in web → file appears/updates under `$HOME/Projects/<project>/` |
| 3 | **Disk → cloud** | Save in local editor → `versions.insert` → web/other client sees change |
| 4 | **Echo suppression** | No insert loop on self-writes |
| 5 | **Marketing hero matches reality** | Hero claims only what mirror + web demonstrate |
| 6 | **FAQ/docs aligned** | No "design phase only" / "backend undecided" drift |
| 7 | **GTM posts refreshed** | Re-run [`grilling/`](./README.md) against shipped surface |

**Launch demo script (60s):**

1. Mirror service running; project tree materialized at `$HOME/Projects/my-app/`
2. Open `src/index.ts` in VS Code (or nvim) — save
3. Web app shows new version in **history/blame** (not textarea edit)
4. Second edit in local editor — web Pierre view shows Tom vs you
5. *(Optional)* `mv` locally — web tree updates (tree diff)

**Not demoed:** typing in web `<textarea>` — removed per ADR 0004.

**Grill policies (015):** Fork **A** (author bytes on disk, freeze remote). Tree **wide** (parentId/name ↔ fs.rename). ADR 0002.

## What can ship before the gate

| Activity | OK? |
|----------|-----|
| Web beta at Vercel for private dogfood | ✅ |
| Mirror client development (macOS spike) | ✅ |
| Docs / schema / collab CLI spike | ✅ |
| Draft GTM copy in `docs/gtm/` | ✅ (marked draft) |
| Product Hunt / Show HN / IH launch | ❌ |
| Paid distribution / UGC / trend-jacking | ❌ (per playbook, after launch-max) |

## Comment-grill implication

PH **S1**, **H1**, HN **S6**, **H2** roasts in [`known-landmines.md`](./known-landmines.md) are **launch blockers**, not reply exercises. Fixing them in comments is the wrong layer — ship mirror client, then launch.

## "No git" positioning (still locked)

Option A + expansion remains canonical when we do launch. See [`01-messaging-core.md`](../01-messaging-core.md).

## Build tasks (ASAP)

| Hole | Task |
|------|------|
| No mirror client — tagline false | [`tasks/015-mirror-client.md`](../../../tasks/015-mirror-client.md) |
| No automated proof + doc landmines | [`tasks/016-launch-gate-verify.md`](../../../tasks/016-launch-gate-verify.md) |