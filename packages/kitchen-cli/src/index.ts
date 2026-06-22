#!/usr/bin/env node
import { runAuthCommand } from "./auth-cmd.js";
import { runChangesCommand } from "./changes.js";

const [command, ...rest] = process.argv.slice(2);

async function main(): Promise<void> {
  switch (command) {
    case "auth":
      await runAuthCommand();
      break;
    case "changes":
      await runChangesCommand(rest);
      break;
    default:
      console.log(`Kitchen CLI — agent/human primitives

Usage:
  kitchen auth                              Interactive browser OAuth → ~/.kitchen/auth.json
  kitchen changes <path> [--since <instant>] [--limit N]

Options:
  --since   Temporal-compatible ISO 8601 instant (filters _creationTime)
  --limit   Max version rows (default 50)

Environment:
  NEXT_PUBLIC_CONVEX_URL, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
  KITCHEN_MIRROR_ROOT (default: $HOME/Projects)

Agents on private paths without auth exit non-zero — human runs \`kitchen auth\` first.
`);
      process.exit(command ? 1 : 0);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});