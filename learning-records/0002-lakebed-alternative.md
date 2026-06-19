# Lakebed as faster web/cloud path

Kitchen's v0 web loop used **Next.js + Convex + Clerk** because tasks 001–014 were written around the Convex reference schema. **[Lakebed](https://docs.lakebed.dev/)** would have been a shorter path for the same novel properties:

| Kitchen need | Lakebed v0 |
|--------------|------------|
| Live sync (WS) | `useQuery` / `useMutation` over WebSocket |
| Auth | Built-in guest + Google (`useAuth`, `SignInWithGoogle`) |
| Insert-only rows | `ctx.db.*.insert` in capsule mutations |
| Server authority | `ctx.auth` in every query/mutation |

```bash
npx lakebed new kitchen-capsule --template todo
npx lakebed dev                    # auth + live DB + WS mutations
npx lakebed auth as alice          # dev identities
npx lakebed db dump --port 3000    # inspect state
npx lakebed deploy                 # ship
```

**Tradeoff:** Lakebed capsules are Preact + `server/index.ts` contract — not Next.js App Router. Kitchen's `./web` Next stack stays canonical for tasks 001–014; a Lakebed capsule could live in `./capsule/` for spikes or a v1 rewrite.

**Implication:** New greenfield spikes should evaluate `npx lakebed` before wiring Convex+Clerk manually. Existing Convex deployment (`hustle-testing/kitchen`) is not abandoned — both backends satisfy "backend-agnostic Sync Store contract" from docs.