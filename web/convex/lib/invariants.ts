import type { Doc, Id } from "../_generated/dataModel";
import { ConvexError } from "convex/values";

export function isOrg(file: Pick<Doc<"files">, "type" | "parentId">): boolean {
  return file.type === "dir" && file.parentId === undefined;
}

export function isProject(
  file: Pick<Doc<"files">, "type" | "parentId">,
  orgId: Id<"files">,
): boolean {
  return file.type === "dir" && file.parentId === orgId;
}

export function assertValidParent(
  type: "dir" | "file",
  parentId: Id<"files"> | undefined,
  parent: Doc<"files"> | null,
): void {
  if (parentId === undefined) {
    if (type !== "dir") {
      throw new ConvexError("Only org roots may have null parent");
    }
    return;
  }
  if (!parent || parent.type !== "dir") {
    throw new ConvexError("Parent must be a directory");
  }
}