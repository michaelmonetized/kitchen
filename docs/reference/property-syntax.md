# Property Syntax

Quick reference for `files.properties` — Kitchen's ACL and metadata layer.

## Format

Properties are a **string → string** map on each File row.

```json
{
  "org:acme-corp": "alice@example.com,bob@example.com",
  "role:editor": "write",
  "role:viewer": "read"
}
```

## Key patterns

| Key pattern | Value | Meaning |
|-------------|-------|---------|
| `owner` | email | Originating owner; transferrable ([ADR 0010](../adr/0010-project-ownership-and-scope.md)) |
| `org:<slug>` | comma-separated emails | Org attachment when scope elevated to `org` |
| `role:<name>` | `"read"` | Users with role `<name>` may read |
| `role:<name>` | `"write"` | Users with role `<name>` may insert versions |
| `role:public` | `"read"` | **Anyone** may read subtree + full version history (FOSS-shaped public project) |
| `role:public` | `"deny"` | Revoke inherited public access on this file — hidden from anonymous tree walks |
| `deleted` | `"true"` | Node tombstoned — excluded from tree walks and mirror live tree; row + versions retained |

## Shorthand notation

Docs sometimes write properties in compact form:

| Shorthand | JSON equivalent |
|-----------|-----------------|
| `role:editor:write` | `"role:editor": "write"` |
| `role:viewer:read` | `"role:viewer": "read"` |

Both describe the same grant. Implementation uses JSON keys.

## Common templates

### Project ownership + scope ([ADR 0010](../adr/0010-project-ownership-and-scope.md))

**Account** = user email (Clerk). **Project** = top-level `~/Projects` entry; cloud **`parentId` = account** (immutable). **`owner`** = session email on push — transferrable.

**`user` (private — default):**

```json
{ "owner": "alice@example.com", "role:user": "write" }
```

**`org` (elevate — Q14):** add org name, write → `org`; read stays `user` for owner:

```json
{
  "owner": "alice@example.com",
  "org:acme-corp": "alice@example.com,bob@example.com",
  "role:user": "read",
  "role:org": "write",
  "role:viewer": "read"
}
```

Owner keeps read via `role:user`; org members write via `role:org`; team read via `role:viewer`.

**`public` (FOSS):**

```json
{ "owner": "alice@example.com", "org:acme-corp": "…", "role:public": "read", "role:org": "write" }
```

All property patches audited ([ADR 0012](../adr/0012-metadata-audit-trail.md)).

### Project root (org-scoped team)

```json
{
  "role:editor": "write",
  "role:viewer": "read"
}
```

### Read-only subtree

Set on a folder File row:

```json
{
  "role:editor": "read",
  "role:viewer": "read"
}
```

### Admin-only file

```json
{
  "role:admin": "write",
  "role:editor": "read"
}
```

## Inheritance

Child files inherit parent properties unless a key is overridden on the child. Walk ancestor chain root → leaf; child wins on collision.

### Public FOSS + secret file (example)

Project `flakebed` (public FOSS):

```json
{ "role:public": "read", "role:editor": "write", "role:viewer": "read" }
```

`.env` (contributor-only — overrides parent):

```json
{ "role:public": "deny", "role:editor": "write" }
```

Anonymous viewers see the public tree **without** `.env`. Editors with the `editor` role see and read `.env`. See [ADR 0009](../adr/0009-public-acl-discovery.md).

## Authorization check (one line)

Write allowed iff: user holds role `N` AND some ancestor (or self) has `"role:N": "write"`.

## Anti-patterns

| Do not | Why |
|--------|-----|
| Rely on `org:*` for security | Display metadata only |
| Use `role:editor:write` as JSON key | Key is `role:editor`, value is `write` |
| Grant write without user_roles row | Property alone does not assign users |

## Related

- [Permissions](../concepts/permissions.md)
- [Orgs and Roles](../concepts/orgs-and-roles.md)
- [Schema](../concepts/schema.md)