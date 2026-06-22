import { runLoginFlow } from "@kitchen/mirror-client/auth";

const AUTH_FAIL_MESSAGE =
  "Kitchen: not authenticated. Run `npx kitchen auth` in your terminal, then retry.";

export function requireInteractiveTty(): void {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error(AUTH_FAIL_MESSAGE);
    process.exit(1);
  }
}

export async function runAuthCommand(): Promise<void> {
  requireInteractiveTty();
  await runLoginFlow();
}

export { AUTH_FAIL_MESSAGE };