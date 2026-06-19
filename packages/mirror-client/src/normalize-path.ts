import { realpathSync } from "node:fs";
import path from "node:path";

/** Canonical absolute path for map keys (resolves macOS /var ↔ /private/var). */
export function normalizeAbsolutePath(absolutePath: string): string {
  const resolved = path.resolve(absolutePath);
  try {
    return realpathSync.native(resolved);
  } catch {
    return resolved;
  }
}