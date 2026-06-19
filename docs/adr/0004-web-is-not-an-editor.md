# Web client is tree, diff, blame, ACL — not an editor

The web platform is **not** a code editor. It is:

- **Tree view** over File rows (orgs, projects, folders)
- **Pierre split diff** per file — history, per-line blame, rollback
- **ACL admin** — group/role controls at file level
- **Agent review** happens outside the product — user prompts their harness; it discovers `.kitchen/docs` + Convex CLI from primitives it already knows (no built-in AI)

All **editing** happens in local tools against `$HOME/Projects` via the mirror client. If the web app ships a `<textarea>` or Monaco as primary file surface, that violates vision — it was a bootstrap spike only.

**Blame:** Each `versions.insert` records `authorUserId`. Latest editor is visible per version; Pierre blame view maps lines to version authors (Tom edits → Tom's version; you edit after → your version). Not `git blame` on commits — insert-only attribution.

**Code review:** Optional — doom-scroll Pierre splits in web, or ask **your** coding agent (Cursor, Claude Code, etc.) — it discovers Kitchen via `.kitchen/docs` and `npx convex`; Kitchen ships no LLM.

**Considered:** Web as primary editor for dogfood — rejected for product; mirror is the edit path.

**Consequences:** Replace `FileEditor.tsx` textarea with diff/blame/history shell ([`tasks/018-web-diff-blame-surface.md`](../../tasks/018-web-diff-blame-surface.md)). Launch gate demo edits happen in VS Code/nvim, not web.