import type { Doc } from "../_generated/dataModel";
import { ConvexError } from "convex/values";
import { isAccountFile, isLegacyOrgFile } from "./account";

export function isOrg(
  file: Pick<Doc<"files">, "type" | "parentId" | "properties">,
): boolean {
  return isLegacyOrgFile(file);
}

export function assertValidParent(
  type: "dir" | "file",
  parentId: Doc<"files">["_id"] | undefined,
  parent: Doc<"files"> | null,
): void {
  if (parentId === undefined) {
    if (type !== "dir") {
      throw new ConvexError("Only account/org roots may have null parent");
    }
    return;
  }
  if (!parent || parent.type !== "dir") {
    throw new ConvexError("Parent must be a directory");
  }
}

export function isRootDir(
  file: Pick<Doc<"files">, "type" | "parentId" | "properties">,
): boolean {
  return (
    file.type === "dir" &&
    file.parentId === undefined &&
    (isAccountFile(file) || isLegacyOrgFile(file))
  );
}