# Web Vision Roasts — Grill Q6

Founder lock (2026-06-18): Web is **tree + Pierre diff/blame/history/rollback + ACL**. Not an editor. `<textarea>` = mission misunderstanding.

## Product truth (canonical)

| Surface | Role |
|---------|------|
| **Mirror + local editor** | Write code (nvim, VS Code, Zed) |
| **Web** | Tree, split diff, per-line blame, history, rollback, role ACL |
| **Review** | Doom-scroll Pierre splits in web *or* prompt **your** harness (reads `.kitchen/docs`, `npx convex`) — no Kitchen AI |
| **Blame** | `authorUserId` per version — Tom saves → Tom's version; you save after → yours |

Positioning: **VCS with ACL first** — not git feature parity; insert-only attribution instead of `git blame`.

---

## H1 — "No blame, no log, not VCS"

**Simulated comment:**
> You claim VCS. No `git log`, no `git blame`, no signed commits. Textarea in browser. That's Drive.

**Tree:**

```
→ Acknowledge web spike had textarea (bootstrap only — being removed)
→ Blame = authorUserId per version + Pierre per-line view
→ Log = version list, not commit graph
→ Edit path = mirror + local editor
```

**Recommended reply:**

> Fair on the textarea — that was a bootstrap spike, not the product. Web is becoming tree + Pierre splits + per-line blame + history/rollback + ACL — not an edit surface. Blame is per version insert (Tom edits → Tom's row; you edit after → yours). Review is optional: doom-scroll the diff or ask an agent to summarize the last 10 edits. You edit in your editor on `$HOME/Projects`; web is for visibility and ceremony when you want it.

---

## H2 — "Why use web at all?"

**Recommended reply:**

> Web is the admin and review layer: tree, merge UI, ACL, blame, rollback. You don't live in it to type — you live in your editor. Web is how you see what happened without `git log`.

---

## H3 — Glazer expects web editor

**Simulated:** "Love editing in the browser!!"

**Reply:** "Editing is on disk in your editor — web is for history, blame, and merge. Try the mirror client + VS Code for writes; web to see who changed what."

---

## Q7 — No product AI (locked)

Kitchen does not ship LLM features. The product is **so simply implemented with primitives** (Convex, insert-only versions, filesystem mirror) that every AI coding harness already has built-in skills and every model has been trained on them.

User asks their agent, with no Kitchen context:

> Tell me how this file has changed over the last N edits.

Harness discovers on its own:

1. VCS here but no `.git`
2. `.kitchen/` → `.kitchen/docs/AGENTS.md`
3. Insert-only Convex; `npx kitchen auth` → `~/.kitchen/auth.json` (private paths)
4. `npx kitchen changes path/to/file [--since <instant>]` for last N inserts

No Kitchen MCP, no summarize button, no custom skill.

See [ADR 0005](../../adr/0005-no-product-ai-agent-discovery.md), task 019.

---

## Landmine

| Issue | Location | Fix |
|-------|----------|-----|
| `<textarea>` primary UX | `web/src/components/editor/FileEditor.tsx` | [`tasks/018-web-diff-blame-surface.md`](../../../tasks/018-web-diff-blame-surface.md) |
| Summarize button / in-app AI | — | **Out of scope** per Q7 |

Launch demo: **edit in VS Code**, review in **web Pierre/history** — not two-tab textarea sync.