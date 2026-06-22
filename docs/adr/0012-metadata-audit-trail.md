# Metadata audit trail — ownership and scope forever

Kitchen is **top-to-bottom VCS**. File **content** is insert-only `versions`. **Metadata** mutations (properties, owner email, org attachment, scope elevation) must also be **permanently auditable** so you can always answer:

- When did owner change?
- When did this project go `user` → `org` → `public` (or FOSS → private)?
- When did org attachment change from one org to another?

## What gets audited

| Event | Example |
|-------|---------|
| Owner transfer | `owner: alice@…` → `owner: bob@…` |
| Scope elevation | add `org:acme`; `role:user` write → `role:org` write |
| Public toggle | add/remove `role:public: read` |
| Org transfer | `org:acme` → `org:beta` |
| Per-file ACL override | `.env` gets `role:public: deny` |

## Implementation options (v0 pick one)

1. **`file_metadata_events` table** — append-only rows: `fileId`, `authorUserId`, `timestamp`, `before`/`after` properties JSON
2. **Property versions** — treat property map changes like content (insert-only property snapshot per file)

Queries: `kitchen changes` sibling `kitchen project-history <path>` or web timeline on project settings.

## Consequences

- Task 024 includes audit log for project property patches
- Web: project settings shows ownership/scope timeline