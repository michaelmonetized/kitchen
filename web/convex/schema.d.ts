declare const _default: import("convex/server").SchemaDefinition<{
    users: import("convex/server").TableDefinition<import("convex/values").VObject<{
        displayName?: string | undefined;
        clerkId: string;
        email: string;
        createdAt: number;
    }, {
        clerkId: import("convex/values").VString<string, "required">;
        email: import("convex/values").VString<string, "required">;
        displayName: import("convex/values").VString<string | undefined, "optional">;
        createdAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "clerkId" | "email" | "displayName" | "createdAt">, {
        by_email: ["email", "_creationTime"];
        by_clerk: ["clerkId", "_creationTime"];
    }, {}, {}>;
    roles: import("convex/server").TableDefinition<import("convex/values").VObject<{
        orgFileId: import("convex/values").GenericId<"files">;
        name: string;
        permissions: string[];
    }, {
        orgFileId: import("convex/values").VId<import("convex/values").GenericId<"files">, "required">;
        name: import("convex/values").VString<string, "required">;
        permissions: import("convex/values").VArray<string[], import("convex/values").VString<string, "required">, "required">;
    }, "required", "orgFileId" | "name" | "permissions">, {
        by_org: ["orgFileId", "name", "_creationTime"];
    }, {}, {}>;
    user_roles: import("convex/server").TableDefinition<import("convex/values").VObject<{
        projectFileId?: import("convex/values").GenericId<"files"> | undefined;
        userId: import("convex/values").GenericId<"users">;
        roleId: import("convex/values").GenericId<"roles">;
    }, {
        userId: import("convex/values").VId<import("convex/values").GenericId<"users">, "required">;
        roleId: import("convex/values").VId<import("convex/values").GenericId<"roles">, "required">;
        projectFileId: import("convex/values").VId<import("convex/values").GenericId<"files"> | undefined, "optional">;
    }, "required", "userId" | "roleId" | "projectFileId">, {
        by_user: ["userId", "_creationTime"];
        by_role: ["roleId", "_creationTime"];
    }, {}, {}>;
    files: import("convex/server").TableDefinition<import("convex/values").VObject<{
        parentId?: import("convex/values").GenericId<"files"> | undefined;
        mime?: string | undefined;
        currentVersionId?: import("convex/values").GenericId<"versions"> | undefined;
        createdAt: number;
        type: "dir" | "file";
        name: string;
        properties: Record<string, string>;
        forked: boolean;
        updatedAt: number;
    }, {
        type: import("convex/values").VUnion<"dir" | "file", [import("convex/values").VLiteral<"dir", "required">, import("convex/values").VLiteral<"file", "required">], "required", never>;
        name: import("convex/values").VString<string, "required">;
        parentId: import("convex/values").VId<import("convex/values").GenericId<"files"> | undefined, "optional">;
        mime: import("convex/values").VString<string | undefined, "optional">;
        properties: import("convex/values").VRecord<Record<string, string>, import("convex/values").VString<string, "required">, import("convex/values").VString<string, "required">, "required", string>;
        currentVersionId: import("convex/values").VId<import("convex/values").GenericId<"versions"> | undefined, "optional">;
        forked: import("convex/values").VBoolean<boolean, "required">;
        createdAt: import("convex/values").VFloat64<number, "required">;
        updatedAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "createdAt" | "type" | "name" | "parentId" | "mime" | "properties" | "currentVersionId" | "forked" | "updatedAt" | `properties.${string}`>, {
        by_parent: ["parentId", "name", "_creationTime"];
        by_parent_type: ["parentId", "type", "_creationTime"];
    }, {}, {}>;
    versions: import("convex/server").TableDefinition<import("convex/values").VObject<{
        parentVersionIds?: import("convex/values").GenericId<"versions">[] | undefined;
        fileId: import("convex/values").GenericId<"files">;
        content: ArrayBuffer;
        authorUserId: import("convex/values").GenericId<"users">;
    }, {
        fileId: import("convex/values").VId<import("convex/values").GenericId<"files">, "required">;
        content: import("convex/values").VBytes<ArrayBuffer, "required">;
        authorUserId: import("convex/values").VId<import("convex/values").GenericId<"users">, "required">;
        parentVersionIds: import("convex/values").VArray<import("convex/values").GenericId<"versions">[] | undefined, import("convex/values").VId<import("convex/values").GenericId<"versions">, "required">, "optional">;
    }, "required", "fileId" | "content" | "authorUserId" | "parentVersionIds">, {
        by_file: ["fileId", "_creationTime"];
    }, {}, {}>;
}, true>;
export default _default;
