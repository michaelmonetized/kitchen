import type { Id } from "./_generated/dataModel";
export declare const projectsForUser: import("convex/server").RegisteredQuery<"public", {}, Promise<{
    org: {
        _id: import("convex/values").GenericId<"files">;
        _creationTime: number;
        parentId?: import("convex/values").GenericId<"files"> | undefined;
        mime?: string | undefined;
        currentVersionId?: import("convex/values").GenericId<"versions"> | undefined;
        createdAt: number;
        type: "dir" | "file";
        name: string;
        properties: Record<string, string>;
        forked: boolean;
        updatedAt: number;
    };
    project: {
        _id: import("convex/values").GenericId<"files">;
        _creationTime: number;
        parentId?: import("convex/values").GenericId<"files"> | undefined;
        mime?: string | undefined;
        currentVersionId?: import("convex/values").GenericId<"versions"> | undefined;
        createdAt: number;
        type: "dir" | "file";
        name: string;
        properties: Record<string, string>;
        forked: boolean;
        updatedAt: number;
    };
}[]>>;
export declare const children: import("convex/server").RegisteredQuery<"public", {
    parentId: import("convex/values").GenericId<"files">;
}, Promise<{
    _id: import("convex/values").GenericId<"files">;
    _creationTime: number;
    parentId?: import("convex/values").GenericId<"files"> | undefined;
    mime?: string | undefined;
    currentVersionId?: import("convex/values").GenericId<"versions"> | undefined;
    createdAt: number;
    type: "dir" | "file";
    name: string;
    properties: Record<string, string>;
    forked: boolean;
    updatedAt: number;
}[]>>;
export declare const listProjectTree: import("convex/server").RegisteredQuery<"public", {
    projectId: import("convex/values").GenericId<"files">;
}, Promise<{
    _id: Id<"files">;
    parentId: Id<"files">;
    name: string;
    type: "dir" | "file";
    forked: boolean;
}[]>>;
export declare const getFile: import("convex/server").RegisteredQuery<"public", {
    fileId: import("convex/values").GenericId<"files">;
}, Promise<{
    _id: import("convex/values").GenericId<"files">;
    _creationTime: number;
    parentId?: import("convex/values").GenericId<"files"> | undefined;
    mime?: string | undefined;
    currentVersionId?: import("convex/values").GenericId<"versions"> | undefined;
    createdAt: number;
    type: "dir" | "file";
    name: string;
    properties: Record<string, string>;
    forked: boolean;
    updatedAt: number;
} | null>>;
export declare const getFileWithContent: import("convex/server").RegisteredQuery<"public", {
    fileId: import("convex/values").GenericId<"files">;
}, Promise<{
    file: {
        _id: import("convex/values").GenericId<"files">;
        _creationTime: number;
        parentId?: import("convex/values").GenericId<"files"> | undefined;
        mime?: string | undefined;
        currentVersionId?: import("convex/values").GenericId<"versions"> | undefined;
        createdAt: number;
        type: "dir" | "file";
        name: string;
        properties: Record<string, string>;
        forked: boolean;
        updatedAt: number;
    };
    content: null;
    version: null;
} | {
    file: {
        _id: import("convex/values").GenericId<"files">;
        _creationTime: number;
        parentId?: import("convex/values").GenericId<"files"> | undefined;
        mime?: string | undefined;
        currentVersionId?: import("convex/values").GenericId<"versions"> | undefined;
        createdAt: number;
        type: "dir" | "file";
        name: string;
        properties: Record<string, string>;
        forked: boolean;
        updatedAt: number;
    };
    content: string;
    version: {
        _id: import("convex/values").GenericId<"versions">;
        _creationTime: number;
        parentVersionIds?: import("convex/values").GenericId<"versions">[] | undefined;
        fileId: import("convex/values").GenericId<"files">;
        content: ArrayBuffer;
        authorUserId: import("convex/values").GenericId<"users">;
    };
} | null>>;
export declare const getForkMergeContext: import("convex/server").RegisteredQuery<"public", {
    leftVersionId?: import("convex/values").GenericId<"versions"> | undefined;
    rightVersionId?: import("convex/values").GenericId<"versions"> | undefined;
    fileId: import("convex/values").GenericId<"files">;
}, Promise<{
    file: {
        _id: import("convex/values").GenericId<"files">;
        _creationTime: number;
        parentId?: import("convex/values").GenericId<"files"> | undefined;
        mime?: string | undefined;
        currentVersionId?: import("convex/values").GenericId<"versions"> | undefined;
        createdAt: number;
        type: "dir" | "file";
        name: string;
        properties: Record<string, string>;
        forked: boolean;
        updatedAt: number;
    };
    heads: {
        _id: import("convex/values").GenericId<"versions">;
        _creationTime: number;
        content: string;
    }[];
    left: {
        _id: import("convex/values").GenericId<"versions">;
        _creationTime: number;
        content: string;
    };
    right: {
        _id: import("convex/values").GenericId<"versions">;
        _creationTime: number;
        content: string;
    };
} | null>>;
export declare const listVersions: import("convex/server").RegisteredQuery<"public", {
    limit?: number | undefined;
    fileId: import("convex/values").GenericId<"files">;
}, Promise<{
    _id: import("convex/values").GenericId<"versions">;
    _creationTime: number;
    authorUserId: import("convex/values").GenericId<"users">;
    parentVersionIds: import("convex/values").GenericId<"versions">[] | undefined;
}[]>>;
