# Orgs and Roles

Kitchen multi-tenancy is simple: **orgs are root directories**, **projects live under orgs**, and **roles gate access** through file properties.

## Org

An org is a File with:

- `type: dir`
- `parent: null` (no parent — this is what makes it an org)

The org is the billing boundary (future), member namespace, and role definition scope.

### Creating an org

An authenticated user inserts an org File row. They become owner with implicit admin capabilities until ownership transfers.

## Project

A project is a File with:

- `type: dir`
- `parent: <org file id>` (exactly one parent, and it must be an org)

All source trees, assets, and nested folders hang under the project root.

```
Org "Acme Corp"
 ├── Project "acme-web"
 └── Project "acme-mobile"
```

A project cannot nest inside another project. Flat under org keeps mirror paths predictable.

## Role table

Each org maintains a **role table** — rows defining named roles:

| Role name | Capabilities |
|-----------|--------------|
| `admin` | Manage roles, assign users, transfer ownership, read/write all project files |
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