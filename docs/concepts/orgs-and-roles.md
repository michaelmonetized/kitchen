# Orgs and Roles

Kitchen: **account = email** (Clerk JWT). **Projects** = top-level `~/Projects` entries on disk; cloud `parentId` = account row (immutable). **Orgs** attach via `org:<name>` property when scope elevates. **Roles** gate access on file properties.

## Org

An org is a File with:

- `type: dir`
- `parent: null` (no parent — this is what makes it an org)

The org is the billing boundary (future), member namespace, and role definition scope.

### Creating an org

An authenticated user inserts an org File row. They become owner with implicit admin capabilities until ownership transfers.

## Account and project

**Account** = user email (one cloud `dir` row per Clerk identity). **Mirror:** each top-level `~/Projects/<name>/` (or top-level file) is a project; daemon sets `owner` from JWT ([ADR 0010](../adr/0010-project-ownership-and-scope.md)):

```
~/Projects/                    Cloud:
├── michael-notes/      →      account(alice@…) → project michael-notes
├── acme-billing/       →      owner: alice@…, org:acme-corp
└── flakebed/           →      owner: alice@…, role:public: read
```

- `parentId` = account id — **immutable**
- `owner` property — transferrable
- Nested `src/` etc. are files inside the project — not projects

### Projects ([ADR 0010](../adr/0010-project-ownership-and-scope.md))

A project is a **`type: dir` file row** whose **`parentId` is the originating account** (immutable). **`owner`** email on properties; transfer via mutation. **Default scope: `user`**.

| Scope | How | Audience |
|-------|-----|----------|
| **`user`** | `"role:user": "write"`, `owner` email | Owner |
| **`org`** | add `org:<name>`; `"role:org": "write"` | Org members (owner retains read) |
| **`public`** | add `"role:public": "read"` | FOSS / anonymous + team |

**FOSS fork** ([ADR 0011](../adr/0011-foss-fork-no-pr.md)): copy public tree to your account — no PR. Per-file ACL overrides parent (e.g. `.env` hidden from public).

## Role table

Each org maintains a **role table** — rows defining named roles:

| Role name | Capabilities |
|-----------|--------------|
| `admin` | Manage roles, assign users, transfer ownership, read/write all project files |
| `user` | Default private project scope — read/write on project-scoped assignment only |
| `editor` | Read/write on assigned projects |
| `viewer` | Read only on assigned projects |

Roles are org-defined. Kitchen ships no global role enum beyond conventions in docs.

## File properties for access

Permissions attach to files as string properties on `files.properties`:

```json
{
  "org:acme-corp": "alice@example.com,bob@example.com",
  "role:editor": "write",
  "role:viewer": "read"
}
```

### Syntax

| Key | Value | Meaning |
|-----|-------|---------|
| `org:<slug>` | comma-separated emails | Org membership hint / display metadata |
| `role:<roleName>` | `"read"` | Grants read to holders of `<roleName>` |
| `role:<roleName>` | `"write"` | Grants write to holders of `<roleName>` |

**Shorthand in prose:** `role:editor:write` means key `role:editor` with value `write`. See [Property Syntax](../reference/property-syntax.md).

Properties inherit down the tree unless overridden (inheritance policy: child files default to parent permissions — exact enforcement TBD in implementation).

## User assignment

Org owners and admins:

1. Create a role in the role table
2. Assign users to that role (user ↔ role mapping table)
3. Set `role:*` properties on org, project, or file rows

Users without a matching role cannot insert versions or read content.

## Ownership transfer

Project owners (and org owners) may transfer ownership to:

- Another **User**
- Another **Org**

Transfer updates the property set and role assignments on the affected File subtree. It is itself an insert (metadata version), not an in-place mutation of historical rows.

## Onboarding flow (target)

```
1. Owner invites user@example.com
2. User accepts, authenticates
3. Admin assigns `editor` role on Project "acme-web"
4. User's desktop client subscribes to project files
5. $HOME/Projects/acme-web/ appears
```

No clone URL. No SSH key for git. Session + role + subscription.

## Comparison to git hosting

| Git hosting | Kitchen |
|-------------|---------|
| Organization on GitHub | Org file row |
| Repository | Project file row |
| Team with read/write | Role + file properties |
| Collaborator invite | Role assignment |
| Repo transfer | Ownership transfer on File |

## Security notes (design)

- Authorization checks run **server-side** on every read and insert
- Client-side UI hiding is not security
- Role names are org-scoped — `editor` in Org A ≠ `editor` in Org B

## Related

- [Data Model](../architecture/data-model.md) — schema-level detail
- [Getting Started](../getting-started.md) — access checklist