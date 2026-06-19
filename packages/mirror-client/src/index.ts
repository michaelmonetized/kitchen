#!/usr/bin/env node
import { runLogin, runMirror } from "./main.js";

const [command] = process.argv.slice(2);

async function main(): Promise<void> {
  switch (command) {
    case "start":
      await runMirror();
      break;
    case "login":
      await runLogin();
      break;
    default:
      console.log(`Kitchen mirror client

Usage:
  kitchen-mirror login   Sign in via browser; saves session to ~/.kitchen/mirror-auth.json
  kitchen-mirror start   Sync Convex ↔ $HOME/Projects

Environment:
  NEXT_PUBLIC_CONVEX_URL, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
  KITCHEN_MIRROR_ROOT (default: $HOME/Projects)
`);
      process.exit(command ? 1 : 0);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});