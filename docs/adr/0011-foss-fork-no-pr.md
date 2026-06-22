# FOSS fork — copy in, own forward, no PR

**Public** projects ([ADR 0010](./0010-project-ownership-and-scope.md)) are forkable in the social sense: any Kitchen user with account + running mirror can materialize publicly readable files into `$HOME/Projects` and **own their copy from that version forward**.

## Flow

```
1. User B browses public project "flakebed" (role:public: read)
2. B's daemon copies visible tree into `~/Projects/flakebed/` (new **top-level** project dir)
3. B's project row: parentId = B's account; `owner` = B's email from JWT
4. From insert version forward, B owns history on their fork — independent fileIds
```

This is **not** git fork/PR semantics. Kitchen ships **no** "open PR" or cross-account merge request path.

## Merging contributor work back

Contributor must **communicate out of band** with org or owner → be **invited onto org** → collaborate on the canonical project → human **Pierre merge** when versions diverge.

Same invariant as every other fork: merge is human, not automatic cross-account PR.

## What copies

- Public-visible paths only (`role:public: deny` nodes omitted — e.g. upstream `.env` not copied)
- Content at current version heads at fork time
- Version history on B's fork starts fresh (first insert = fork snapshot); upstream history remains on canonical project

**Considered:** Full history clone on fork — rejected for v0; B owns forward from snapshot.

## Consequences

- Task 024 / mirror: "fork public project" action
- GTM: say "fork and own your copy" not "send a PR"