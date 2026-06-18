import type { Id } from "../../convex/_generated/dataModel";

const CONVEX_ID_RE = /^[a-z0-9]{16,64}$/;

export function parseFileId(raw: string) {
  if (!CONVEX_ID_RE.test(raw)) return null;
  return raw as Id<"files">;
}

export function parseProjectId(raw: string) {
  return parseFileId(raw);
}