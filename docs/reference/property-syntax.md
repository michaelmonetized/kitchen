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
| `org:<slug>` | comma-separated emails | Membership display hint — not the auth boundary |
| `role:<name>` | `"read"` | Users with role `<name>` may read |
| `role:<name>` | `"write"` | Users with role `<name>` may insert versions |
| `deleted` | `"true"` | Node tombstoned — excluded from tree walks and mirror live tree; row + versions retained |

## Shorthand notation

Docs sometimes write properties in compact form:

| Shorthand | JSON equivalent |
|-----------|-----------------|
| `role:editor:write` | `"role:editor": "write"` |
| `role:viewer:read` | `"role:viewer": "read"` |

Both describe the same grant. Implementation uses JSON keys.

## Common templates

### Project root (typical team)

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