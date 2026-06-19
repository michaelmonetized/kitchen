import type { Doc, Id } from "../_generated/dataModel";
export declare function isOrg(file: Pick<Doc<"files">, "type" | "parentId">): boolean;
export declare function isProject(file: Pick<Doc<"files">, "type" | "parentId">, orgId: Id<"files">): boolean;
export declare function assertValidParent(type: "dir" | "file", parentId: Id<"files"> | undefined, parent: Doc<"files"> | null): void;
