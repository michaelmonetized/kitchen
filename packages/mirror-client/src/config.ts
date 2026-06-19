import { homedir } from "node:os";
import path from "node:path";

export const KITCHEN_DIR = path.join(homedir(), ".kitchen");
export const AUTH_FILE = path.join(KITCHEN_DIR, "mirror-auth.json");

export function defaultMirrorRoot(): string {
  return path.join(homedir(), "Projects");
}

export function resolveMirrorRoot(): string {
  return process.env.KITCHEN_MIRROR_ROOT ?? defaultMirrorRoot();
}

export function resolveConvexUrl(): string {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL or CONVEX_URL required (run scripts/setup-env.sh)",
    );
  }
  return url;
}

export function resolveClerkPublishableKey(): string | undefined {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}