export declare const listOrgsForUser: import("convex/server").RegisteredQuery<"public", {}, Promise<{
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
    roles: string[];
    isAdmin: boolean;
}[]>>;
export declare const getOrgContext: import("convex/server").RegisteredQuery<"public", {
    orgId: import("convex/values").GenericId<"files">;
}, Promise<{
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
    isAdmin: boolean;
    roles: {
        _id: import("convex/values").GenericId<"roles">;
        name: string;
        permissions: string[];
    }[];
    projects: {
        _id: import("convex/values").GenericId<"files">;
        name: string;
        properties: Record<string, string> | undefined;
    }[];
    members: {
        assignmentId: import("convex/values").GenericId<"user_roles">;
        userId: import("convex/values").GenericId<"users">;
        email: string;
        displayName: string | undefined;
        roleId: import("convex/values").GenericId<"roles">;
        roleName: string;
        projectFileId: import("convex/values").GenericId<"files"> | undefined;
        projectName: string | undefined;
    }[];
    userRoles: string[];
} | null>>;
export declare const createOrg: import("convex/server").RegisteredMutation<"public", {
    name: string;
    slug: string;
}, Promise<import("convex/values").GenericId<"files">>>;
export declare const createProject: import("convex/server").RegisteredMutation<"public", {
    name: string;
    orgId: import("convex/values").GenericId<"files">;
}, Promise<import("convex/values").GenericId<"files">>>;
export declare const createRole: import("convex/server").RegisteredMutation<"public", {
    name: string;
    permissions: string[];
    orgId: import("convex/values").GenericId<"files">;
}, Promise<import("convex/values").GenericId<"roles">>>;
export declare const updateRole: import("convex/server").RegisteredMutation<"public", {
    name?: string | undefined;
    permissions?: string[] | undefined;
    roleId: import("convex/values").GenericId<"roles">;
}, Promise<import("convex/values").GenericId<"roles">>>;
export declare const deleteRole: import("convex/server").RegisteredMutation<"public", {
    roleId: import("convex/values").GenericId<"roles">;
}, Promise<void>>;
export declare const inviteMember: import("convex/server").RegisteredMutation<"public", {
    projectFileId?: import("convex/values").GenericId<"files"> | undefined;
    email: string;
    roleId: import("convex/values").GenericId<"roles">;
    orgId: import("convex/values").GenericId<"files">;
}, Promise<import("convex/values").GenericId<"user_roles">>>;
export declare const removeMember: import("convex/server").RegisteredMutation<"public", {
    assignmentId: import("convex/values").GenericId<"user_roles">;
}, Promise<void>>;
export declare const setProjectProperties: import("convex/server").RegisteredMutation<"public", {
    properties: Record<string, string>;
    projectId: import("convex/values").GenericId<"files">;
}, Promise<void>>;
export declare const transferProjectOwnership: import("convex/server").RegisteredMutation<"public", {
    projectId: import("convex/values").GenericId<"files">;
    newOwnerEmail: string;
}, Promise<{
    projectId: import("convex/values").GenericId<"files">;
    newOwnerEmail: string;
}>>;
export declare const ensurePersonalOrg: import("convex/server").RegisteredMutation<"public", {}, Promise<{
    orgId: import("convex/values").GenericId<"files">;
    projectId: import("convex/values").GenericId<"files">;
} | null>>;
