# Task 025: FOSS fork — copy public tree to your account

**Depends on:** 024-account-parent-projects, 023-public-acl, 015-mirror-client  
**ADR:** [`0011-foss-fork-no-pr.md`](../docs/adr/0011-foss-fork-no-pr.md)

## Goal

User with Kitchen account + daemon can fork a **public** project into `$HOME/Projects` under **their account** — own inserts from snapshot forward. No PR path.

## Done criteria

- [x] Mirror or web action: "Fork to my account" on public project
- [x] Copy public-visible files only (`role:public: deny` omitted)
- [x] New project row: parent = forker's account; `owner` = forker email; scope default `user`
- [x] Initial version insert per file = snapshot bytes at fork time
- [x] Docs: merge back = join org + Pierre merge, not PR
- [x] GTM/grilling copy: no "open PR" language

## Verify

```bash
# User B forks public flakebed → ~/Projects/flakebed/
# B edits → versions under B's project fileIds
# Upstream flakebed unchanged
```

## References

- [0010 project ownership](../docs/adr/0010-project-ownership-and-scope.md)