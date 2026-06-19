# Known Landmines

Commenters **will** find these.

**Launch policy (2026-06-18):** Do not run PH/HN until [`02-launch-gate.md`](./02-launch-gate.md) criteria pass. Landmines below are **ship blockers**, not comment-reply drills.

## Critical (fix before launch — gate blockers)

| Landmine | Where | What commenters will say | Pre-launch fix |
|----------|-------|--------------------------|----------------|
| **FAQ says no working app** | `docs/faq.md` L39–41 | "OP claims beta live but FAQ says design-phase only — which is it?" | Update FAQ to match shipped web beta |
| **FAQ says backend undecided** | `docs/faq.md` L45–47 | "You say Convex in posts but FAQ says undecided" | Update FAQ: Convex = reference impl |
| **Marketing promises mirror + pair** | `web/src/app/(marketing)/page.tsx` | "Site says nvim+VS Code pair — web beta is textarea in browser" | **Ship desktop mirror first** — see `02-launch-gate.md` |
| **Web textarea "editor"** | `web/src/components/editor/FileEditor.tsx` L146 | "You claim not an IDE but ship a textarea" | [`tasks/018-web-diff-blame-surface.md`](../../../tasks/018-web-diff-blame-surface.md), ADR 0004 |

## High (reply-ready, may not fix pre-launch)

| Landmine | Truth | Reply kernel |
|----------|-------|--------------|
| **Desktop mirror not shipped** | Web beta only; `$HOME/Projects` is designed contract | "Mirror driver is next; beta proves Sync Store + live sync" |
| **Collab is CLI spike** | `npm run spike:pair` in packages, not product UI | "Collab proof in repo; productizing after mirror" |
| **Pierre merge dependency** | External diff/merge primitives | "Human line-pick via Pierre; auto-merge explicitly out of scope" |
| **No git import** | VISION out of scope | "First-principles store; import may come later" |
| **Offline not shipped yet** | FAQ may lag ADR 0006 | Policy locked (Notion-style); task 020 — don't claim plane mode until verify |
| **50 MB soft cap** | Per version row | "Same model for binaries; scale testing not done" |
| **Codename Kitchen** | Working title | One disclaimer per post; don't apologize twice |

## Medium (positioning, not bugs)

| Landmine | Reply kernel |
|----------|--------------|
| "Just use Syncthing/Dropbox" | Bytes on disk vs version rows + ACL + merge model |
| "Live Share already does pair" | Editor-specific vs Collab agent + editor-agnostic |
| "This is Google Docs for code" | Docs optimizes concurrent OT; Kitchen = versions + fork + human merge |
| **"No git = no versioning"** | Use canonical expansion — command loop gone, version rows stay |
| "Convex lock-in" | Sync Store contract is vendor-agnostic; Convex is reference |
| "ACL on file properties is weird" | Three entities only; no fourth ACL table; inheritance walk |

## Doc/code cross-check log (grill session)

```
[2026-06-18] FAQ "working app" contradicts README "Web beta shipped"     → task 016
[2026-06-18] Marketing page claims pair/collab without web UI            → task 016 audit
[2026-06-18] FileEditor.tsx points to mirror client for binaries         → task 015
[2026-06-18] No mirror client at all                                     → task 015
[2026-06-18] Bidirectional echo loop risk (cloud↔disk)                 → task 015 echo suppress + task 016 storm test
```

## Mirror edge cases (post-015 — will surface at launch)

| Landmine | Grill doc | Status |
|----------|-----------|--------|
| Two heads, one disk path | [`03-mirror-edge-cases.md` E1](./03-mirror-edge-cases.md) | ✅ Policy A |
| Local rename/move/delete | E4 + ADR 0002 | ✅ Tree diff wide sync in 015 |
| `.git` in mirror | E3 | Ignore in watcher |
| macOS-only mirror | E6 | GTM wording |

## Task mapping

| Landmine | Fix task |
|----------|----------|
| Mirror promise false | [`tasks/015-mirror-client.md`](../../../tasks/015-mirror-client.md) |
| Echo-safe bidirectional sync | 015 (implement) + 016 (automated storm test) |
| FAQ / marketing drift | [`tasks/016-launch-gate-verify.md`](../../../tasks/016-launch-gate-verify.md) |