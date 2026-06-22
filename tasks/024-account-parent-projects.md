# Task 024: Email account + ~/Projects top-level projects

**Depends on:** 004-authz-layer, 015-mirror-client  
**Grill Q13–Q15:** Account = email; `~/Projects/*` = projects; owner from Clerk JWT  
**ADRs:** [0010](../docs/adr/0010-project-ownership-and-scope.md), [0012](../docs/adr/0012-metadata-audit-trail.md)

## Goal

Account is user email (Clerk). Each **top-level** `~/Projects` entry is a project with `owner` = session email. Cloud `parentId` = account row (immutable). Org/public via properties.

## Done criteria

### Account + auth

- [x] Account `dir` row per email (create on first `kitchen auth` / daemon login)
- [x] Account **`username`** slug (unique) for URLs — `/<username>/<project>` ([ADR 0013](../docs/adr/0013-project-namespace-and-urls.md))
- [x] Clerk JWT on Convex client (daemon + `@kitchen/cli`)
- [x] `properties.owner` = JWT email on project create/push
- [x] Project name unique per account `(parentId, name)` — cross-account collision OK

### Mirror (Q15)

- [x] Top-level `~/Projects` children (dirs + optional files) = project roots
- [x] New folder at top level → `files.insert` project under account; `owner` from session
- [x] Nested paths = files inside project only

### Scope + Q14

- [x] Default `role:user: write` on new project
- [x] Elevation: `org:<name>` + `role:org` write; `parentId` unchanged
- [x] Ownership transfer: patch `owner` email + audit ([ADR 0012](../docs/adr/0012-metadata-audit-trail.md))

### Authz + schema docs

- [x] `role:user` / `role:org` / `role:public` in `canRead` / `canWrite`
- [x] `docs/concepts/schema.md` parent invariants updated

## Verify

```bash
npx kitchen auth
mkdir ~/Projects/my-app && echo hi > ~/Projects/my-app/readme.md
# → project row owner = your Clerk email
```

## References

- [0011 FOSS fork](../docs/adr/0011-foss-fork-no-pr.md)