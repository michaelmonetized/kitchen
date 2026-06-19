# Task 015: Mirror Client

**Depends on:** 014-ship-product  
**Output:** `packages/mirror-client/` — TypeScript desktop process clearing launch gate §1–2  
**Grilling hole:** *"Your editor sees them on disk"* is false until this ships ([`docs/gtm/grilling/02-launch-gate.md`](../docs/gtm/grilling/02-launch-gate.md))

## Goal

Build the v0 **Mirror client**: a TypeScript process (Electron menubar app **or** headless background daemon — same sync engine) that bidirectionally syncs the Convex Sync Store and `$HOME/Projects/<project>/`.

Per [ADR 0001](../docs/adr/0001-mirror-client-typescript-convex.md):

- **Cloud → disk:** Convex live subscription (default realtime) → write directory tree + file bytes on change
- **Disk → cloud:** FS watcher on mirror root → debounce → `versions.insert`

macOS first. Menubar/tray UI is optional status chrome (login, project list, sync state).

## Done criteria

- [x] `packages/mirror-client/` workspace with `package.json`, TypeScript build, `npm run dev` / `npm run start`
- [x] Clerk-authenticated Convex client (session survives daemon restart — document token strategy)
- [x] On login: fetch authorized projects via existing queries; materialize `$HOME/Projects/<slug>/` trees
- [x] **Cloud → disk:** subscription to project file tree + current version bytes; atomic write (temp + rename)
- [x] **Disk → cloud:** `@parcel/watcher` (or equivalent) on mirror root; debounced save detection
- [x] **Echo suppression:** paths written by cloud→disk ignored by watcher ~500ms ([`desktop-sync.md`](../docs/clients/desktop-sync.md))
- [x] Text file roundtrip: edit in local editor → Convex version row → web client sees update
- [x] Reverse roundtrip: edit in web → local file on disk updates
- [x] `packages/mirror-client/README.md` — install, auth, mirror root, dev workflow
- [x] Root `package.json` script: `dev:mirror` and/or `npm run mirror -w @kitchen/mirror-client`

## Steps

1. Scaffold `packages/mirror-client/`:
   - Name: `@kitchen/mirror-client`
   - Deps: `convex`, `@clerk/backend` or Clerk device/browser token flow, `@parcel/watcher`
   - Optional: `electron` + menubar only if needed for auth UX; daemon-only path must work

2. Share Convex types from `web/convex/` (codegen import or relative `_generated/api`)

3. **Cloud → disk engine:**
   - Subscribe `api.projects.*` / file tree queries used by web app
   - On `version` event for file: resolve mirror path from parent chain
   - Write bytes; mark path in echo-suppression set

4. **Disk → cloud engine:**
   - Watch `$HOME/Projects/`
   - On change: skip if echo-suppressed; read bytes; call `versions.insert` mutation
   - Handle `forked` response — log/notify (full Pierre UI not required this task)

5. **Auth:** Reuse Clerk app `app_3FKGf5FjU0xo2auiacRVidD84r0` — implement smallest viable login (browser OAuth → store token for daemon, or Clerk CLI pattern). Document in package README.

6. Minimal menubar (if Electron): synced / syncing / error states; quit.

## Verify

```bash
npm install
npm run build -w @kitchen/mirror-client

# Terminal A: web + convex
cd web && npx convex dev &
npm run dev:web &

# Terminal B: mirror client (after auth)
npm run dev:mirror

# Manual launch-gate check:
# 1. $HOME/Projects/<project>/ exists with files
# 2. echo "local" >> $HOME/Projects/<project>/foo.ts — web shows new version
# 3. Edit foo.ts in web — local file updates
# 4. Rapid double-save in editor — no version insert storm (echo suppress)
```

## Out of scope

- Windows/Linux (macOS only for v0)
- Collab agent / pair sessions
- Offline queue (assume online; block or warn on disconnect)
- Binary files > 50MB
- PH/HN launch ([`016-launch-gate-verify.md`](./016-launch-gate-verify.md))

## Grill follow-up

015 covers baseline bidirectional content sync. Launch gate also requires fork policy A, tree diff, soft delete — see [`017-mirror-grill-gaps.md`](./017-mirror-grill-gaps.md) (ADRs 0002–0003).

## References

- [`docs/clients/desktop-sync.md`](../docs/clients/desktop-sync.md)
- [`docs/gtm/grilling/02-launch-gate.md`](../docs/gtm/grilling/02-launch-gate.md)
- [`docs/adr/0001-mirror-client-typescript-convex.md`](../docs/adr/0001-mirror-client-typescript-convex.md)
- [`docs/concepts/sync-model.md`](../docs/concepts/sync-model.md)