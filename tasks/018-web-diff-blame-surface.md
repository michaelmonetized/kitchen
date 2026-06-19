# Task 018: Web Diff / Blame Surface (No Textarea)

**Depends on:** 010-fork-merge (Pierre UI baseline), 017-mirror-grill-gaps (optional for full demo)  
**Grilling hole:** [`FileEditor.tsx`](../web/src/components/editor/FileEditor.tsx) uses `<textarea>` — vision violation per founder grill Q6

## Goal

Replace the web "editor" with a **read-oriented file surface**: tree navigation + Pierre split diff, per-line blame, version history, rollback, and file-level ACL controls. **No `<textarea>`** as primary UX.

Editing belongs in local editors via mirror client. Web may trigger rollback (pointer to prior version) and merge — not daily typing.

## Done criteria

- [x] Remove `<textarea>` from primary file route (`files/[fileId]/page.tsx` / `FileEditor.tsx`)
- [x] **History panel:** list versions for file (`authorUserId`, timestamp) — last 10 visible; link to older
- [x] **Pierre split view:** select two versions (or version vs current) — side-by-side diff
- [x] **Per-line blame:** map lines to version authors (from Pierre + version metadata)
- [x] **Rollback:** action sets `currentVersionId` to chosen version (mutation exists or add `files.setCurrentVersion` UI)
- [x] **ACL controls:** file properties `role:*` editor on file or project settings (reuse org admin patterns)
- [x] Fork badge → merge route unchanged
- [x] **No AI UI** — no summarize button; agents use `.kitchen/docs` + Convex CLI ([ADR 0005](../docs/adr/0005-no-product-ai-agent-discovery.md))
- [x] `docs/clients/web-and-mobile.md` aligned (no "text editor" responsibility)
- [x] No regression: `npm run build` in `web/`

## Out of scope

- Monaco/CodeMirror as edit surface
- LSP, terminal, preview
- Any built-in LLM / summarize / agent runtime (see task 019)

## Verify

```bash
cd web && npm run build
# Manual: open file in web → see diff/blame/history, not textarea
# Manual: edit same file in mirror/local editor → web history updates
```

## References

- [`docs/adr/0004-web-is-not-an-editor.md`](../docs/adr/0004-web-is-not-an-editor.md)
- [`docs/gtm/grilling/03-mirror-edge-cases.md`](../docs/gtm/grilling/03-mirror-edge-cases.md) — positioning
- [`VISION.md`](../VISION.md) — editor-agnostic work