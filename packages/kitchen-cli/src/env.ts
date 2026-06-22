import { readFile } from "node:fs/promises";
import path from "node:path";

/** Load key=value pairs from web/.env.local when env vars are unset. */
export async function loadKitchenEnv(startDir = process.cwd()): Promise<void> {
  if (
    process.env.NEXT_PUBLIC_CONVEX_URL &&
    process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ) {
    return;
  }

  let dir = startDir;
  for (;;) {
    const envPath = path.join(dir, "web", ".env.local");
    try {
      const raw = await readFile(envPath, "utf8");
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq <= 0) continue;
        const key = trimmed.slice(0, eq);
        let value = trimmed.slice(eq + 1);
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = value;
      }
      return;
    } catch {
      const parent = path.dirname(dir);
      if (parent === dir) return;
      dir = parent;
    }
  }
}