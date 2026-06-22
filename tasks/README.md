# Kitchen build tasks — web/cloud layer

Sequential tasks for building the **marketable web product** in `./web`. Each file is one agent iteration target for `./loop.sh`.

> **Note:** [`npx lakebed`](https://docs.lakebed.dev/) would have been a faster path for auth + live WS mutations (built-in `useQuery`/`useMutation`, `ctx.auth`, `ctx.db`). Tasks 001–014 intentionally target Next+Convex+Clerk in `./web`. For greenfield spikes, see [learning-records/0002-lakebed-alternative.md](../learning-records/0002-lakebed-alternative.md).

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

### Launch gate (post–014 — grilling blockers)

| # | Task | Grilling hole | Delivers |
|---|------|---------------|----------|
| 015 | [mirror-client](./015-mirror-client.md) | *"Your editor sees them on disk"* is false | `packages/mirror-client` — Convex ↔ `$HOME/Projects` |
| 016 | [launch-gate-verify](./016-launch-gate-verify.md) | No proof + doc/marketing landmines | `mirror-smoke`, FAQ aligned, GTM unlock |
| 017 | [mirror-grill-gaps](./017-mirror-grill-gaps.md) | Fork A, tree diff, soft delete | ADR 0002–0003 on top of 015 spike |
| 018 | [web-diff-blame-surface](./018-web-diff-blame-surface.md) | Textarea violates vision | Pierre blame/history/rollback web shell |
| 019 | [agent-discovery-kit](./019-agent-discovery-kit.md) | No product AI | `.kitchen/docs/AGENTS.md` per project |
| 020 | [offline-save-queue](./020-offline-save-queue.md) | Plane / lid-close | Notion-style queue + reconnect flush |
| 021 | [kitchen-cli-changes](./021-kitchen-cli-changes.md) | Agent primitive | `kitchen auth` + `kitchen changes path [--since instant]` |
| 023 | [public-acl](./023-public-acl.md) | Discovery / hiring | `role:public: read` anonymous browse |
| 024 | [account-parent-projects](./024-account-parent-projects.md) | Q13–Q14 ownership | Account parent; org property; audit trail |
| 025 | [foss-fork-copy](./025-foss-fork-copy.md) | Social fork | Copy public tree; no PR |
| 026 | [username-onboarding](./026-username-onboarding.md) | Q17 identity | `/onboarding`, `/account/`, 301 redirects |

Source: [`docs/gtm/grilling/02-launch-gate.md`](../docs/gtm/grilling/02-launch-gate.md), [`known-landmines.md`](../docs/gtm/grilling/known-landmines.md).

**Loop note:** Tasks 001–014 set `SHIP_COMPLETE`. Re-run `./loop.sh` for 015→016 (clear `.kitchen-loop/SHIP_COMPLETE` or extend loop completion to 016).

## Ground truth docs

Read before implementing:

- [docs/the-kitchen-way.md](../docs/the-kitchen-way.md)
- [docs/concepts/schema.md](../docs/concepts/schema.md)
- [docs/concepts/permissions.md](../docs/concepts/permissions.md)
- [docs/clients/web-and-mobile.md](../docs/clients/web-and-mobile.md)
- [GLOSSARY.md](../GLOSSARY.md)

## Code QA loop (refactor)

Product tasks 001–014 are **complete**. Code quality refactors live in [`tasks/qa/`](./qa/README.md) (plans 012–016).

```bash
./loop-qa.sh
KITCHEN_LOOP_SERIES=qa node scripts/task-loop.mjs status
```

## Run the product loop

```bash
./loop.sh
```

Inspect without running:

```bash
node scripts/task-loop.mjs status
node scripts/task-loop.mjs next
```