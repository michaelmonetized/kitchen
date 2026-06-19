# Soft delete via `deleted` file property

Deleting a file or folder does **not** remove the `files` row or its `versions`. The mirror client (or web UI) sets `properties.deleted = "true"` on the node. Tree walks and mirror diffs **skip** rows where `deleted === "true"`, so tombstoned subtrees have no entry point from the project root — no orphan paths in the live tree.

**Retention:** Infinite. History remains queryable for audit/ACL; this is version control first, not disposable cloud storage.

**Local `rm`:** Daemon patches the corresponding `files` row with `deleted: "true"`; removes path from disk (already gone locally). Peers drop it from tree on next diff.

**Cloud delete:** Same property patch; mirror diff removes path on disk.

**Considered:** Hard delete (B), ignore local rm (C), timed purge (D) — all rejected.

**Consequences:** All tree queries (`children`, `listProjectTree`, mirror subscription) must filter `properties.deleted`. Task 015 adds `files.markDeleted` (or `updateMetadata`) + query filters.