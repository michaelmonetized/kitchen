# Task 023: Public ACL — FOSS + per-file override

**Depends on:** 004-authz-layer, 006-core-queries  
**Grill Q11 + Q13:** `user`/`org`/`public` scope on project row; default `user`; `public` child overrides  
**ADRs:** [0009](../docs/adr/0009-public-acl-discovery.md), [0010](../docs/adr/0010-project-ownership-and-scope.md)

## Goal

`role:public: read` on a project grants anonymous FOSS-style access (tree + content + version history). Per-file overrides (`role:public: deny`, contributor-only roles) hide nodes from public tree walks.

## Done criteria

- [x] `canReadAnonymous(fileId)` — true when merged `role:public` is `read` (not `deny`)
- [x] `canRead` for authenticated users unchanged (role-based)
- [x] `children`, `listProjectTree`: anonymous queries **omit** nodes failing `canReadAnonymous` (e.g. `.env` invisible to public)
- [x] `getFileWithContent`, `listVersions`: anonymous allowed only when `canReadAnonymous`
- [x] `role:public: deny` documented and enforced as child override
- [x] Web public browse route respects filtered tree
- [x] `kitchen changes` on public visible path works without token; on denied path → FORBIDDEN
- [x] Verify fixture: `michael-notes` (default `user`), `acme-billing` (`org`), `flakebed` (`public`)
- [x] Discovery/browse surfaces list FOSS only; org picker shows org-only for members

## Out of scope

- Public write
- CI service accounts

## Verify

```bash
# Public flakebed README — no auth
npx kitchen changes README.md --limit 5
# → JSON versions

# .env — no auth (not in public tree)
npx kitchen changes .env
# → FORBIDDEN or not found

# Editor with kitchen auth
npx kitchen auth && npx kitchen changes .env --limit 3
# → succeeds
```

## References

- [ADR 0008](../docs/adr/0008-cli-auth-fail-closed.md)