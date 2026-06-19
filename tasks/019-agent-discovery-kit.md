# Task 019: Agent Discovery Kit (`.kitchen/docs`)

**Depends on:** 015-mirror-client (materialize projects)  
**Grill Q7:** No product AI — external agents discover Kitchen via `.kitchen/docs` + Convex CLI

## Goal

Each mirrored project includes a **`.kitchen/docs/`** folder so a harness *emerges* into Kitchen from primitives it already knows (Convex, VCS-shaped history, CLI):

> User: *"Tell me how this file changed over N edits."* → no `.git` → `.kitchen/docs` → `npx kitchen changes path [--since instant]` (daemon auth at `~/.kitchen/`).

## Done criteria

- [x] Template in `packages/mirror-client/templates/.kitchen/docs/` (or sync from repo `templates/project-kitchen-docs/`)
- [x] On project materialization / sync, mirror ensures `.kitchen/docs/AGENTS.md` exists (don't overwrite user edits — create-if-missing)
- [x] `AGENTS.md` covers: no git; `npx kitchen changes`; `npx kitchen auth` → `~/.kitchen/auth.json`; `role:public`; offline Notion-style note
- [x] Optional: `.kitchen/convex.json` or pointer to deployment URL from env
- [x] Document in `packages/mirror-client/README.md` and `docs/clients/agent-discovery.md`
- [x] **No** summarize button / LLM / Convex action in web app

## Out of scope

- Built-in AI in Kitchen web or daemon
- Custom MCP server (harnesses use Convex CLI + docs)

## Verify

```bash
# After mirror syncs project:
ls $HOME/Projects/<project>/.kitchen/docs/AGENTS.md
# Agent smoke: prompt-compatible — file mentions versions table, npx convex, no git
```

## References

- [`docs/adr/0005-no-product-ai-agent-discovery.md`](../docs/adr/0005-no-product-ai-agent-discovery.md)
- [`docs/gtm/grilling/04-web-vision-roasts.md`](../docs/gtm/grilling/04-web-vision-roasts.md)