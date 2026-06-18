# Kitchen build tasks — web/cloud layer

Sequential tasks for building the **marketable web product** in `./web`. Each file is one agent iteration target for `./loop.sh`.

## Order

| # | Task | Delivers |
|---|------|----------|
| 001 | [web-scaffold](./001-web-scaffold.md) | `./web` Next.js + Convex + Clerk skeleton |
| 002 | [convex-schema](./002-convex-schema.md) | Sync Store tables per `docs/concepts/schema.md` |
| 003 | [auth-clerk](./003-auth-clerk.md) | Sign-in, sessions, user sync |
| 004 | [authz-layer](./004-authz-layer.md) | Property-based `canRead` / `canWrite` |
| 005 | [core-mutations](./005-core-mutations.md) | `files.*`, `versions.insert`, pointer policy |
| 006 | [core-queries](./006-core-queries.md) | Tree, history, `projects.forUser` |
| 007 | [web-shell](./007-web-shell.md) | Protected app chrome, navigation |
| 008 | [project-browser](./008-project-browser.md) | Org/project picker + file tree |
| 009 | [file-editor](./009-file-editor.md) | Monaco editor, save → version insert |
| 010 | [fork-merge](./010-fork-merge.md) | Fork badge + human merge UI |
| 011 | [org-admin](./011-org-admin.md) | Roles, assignments, create org/project |
| 012 | [collab-relay](./012-collab-relay.md) | Web collab participant + checkpoint |
| 013 | [landing-marketing](./013-landing-marketing.md) | Landing, onboarding, polish |
| 014 | [ship-product](./014-ship-product.md) | Vercel deploy, smoke tests, shippable |

## Ground truth docs

Read before implementing:

- [docs/the-kitchen-way.md](../docs/the-kitchen-way.md)
- [docs/concepts/schema.md](../docs/concepts/schema.md)
- [docs/concepts/permissions.md](../docs/concepts/permissions.md)
- [docs/clients/web-and-mobile.md](../docs/clients/web-and-mobile.md)
- [GLOSSARY.md](../GLOSSARY.md)

## Run the loop

```bash
./loop.sh
```

Inspect without running:

```bash
node scripts/task-loop.mjs status
node scripts/task-loop.mjs next
```