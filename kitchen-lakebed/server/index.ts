import { boolean, capsule, endpoint, mutation, query, string, table, text } from "lakebed/server";

export default capsule({
  name: "kitchen-lakebed",

  schema: {
    users: table({
      clerkId: string(),
      email: string().default(""),
      displayName: string().default(""),
      username: string().default(""),
      accountFileId: string().default(""),
      onboardingComplete: boolean().default(false),
      usernameChangeCount: string().default("0"),
    }),
    roles: table({
      orgFileId: string(),
      name: string(),
      permissions: string().default("[]"),
    }),
    user_roles: table({
      userId: string(),
      roleId: string(),
      projectFileId: string().default(""),
    }),
    files: table({
      type: string(),
      name: string(),
      parentId: string().default(""),
      mime: string().default(""),
      properties: string().default("{}"),
      currentVersionId: string().default(""),
      ownerId: string(),
      forked: boolean().default(false)
    }),
    versions: table({
      fileId: string(),
      content: string(),
      authorId: string(),
      parentVersionIds: string().default("[]"),
    })
  },

  queries: {
    listProjects: query((ctx) => {
      return ctx.db.files
        .all()
        .filter(f => {
          const props = f.properties ? JSON.parse(f.properties) : {};
          return f.type === "dir" && props.kind === "project" && (f.ownerId === ctx.auth.userId || props["role:public"] === "read");
        })
        .map(f => {
          const owner = ctx.db.users.all().find(u => u.clerkId === f.ownerId);
          return { ...f, ownerUsername: owner?.username };
        });
    }),
    listTree: query((ctx, parentId: string) => {
      if (!parentId) return [];
      const parent = ctx.db.files.get(parentId);
      const props = parent?.properties ? JSON.parse(parent.properties) : {};
      if (!parent || (parent.ownerId !== ctx.auth.userId && props["role:public"] !== "read")) return [];
      return ctx.db.files
        .where("parentId", parentId)
        .orderBy("createdAt", "desc")
        .all();
    }),
    getFile: query((ctx, fileId: string) => {
      if (!fileId) return null;
      const f = ctx.db.files.get(fileId);
      const props = f?.properties ? JSON.parse(f.properties) : {};
      if (!f || (f.ownerId !== ctx.auth.userId && props["role:public"] !== "read")) return null;
      return f;
    }),
    getVersions: query((ctx, fileId: string) => {
      if (!fileId) return [];
      const f = ctx.db.files.get(fileId);
      const props = f?.properties ? JSON.parse(f.properties) : {};
      if (!f || (f.ownerId !== ctx.auth.userId && props["role:public"] !== "read")) return [];
      return ctx.db.versions
        .where("fileId", fileId)
        .orderBy("createdAt", "desc")
        .all();
    }),
    getVersion: query((ctx, versionId: string) => {
      if (!versionId) return null;
      return ctx.db.versions.get(versionId);
    }),
    getCurrentUser: query((ctx) => {
      if (ctx.auth.isGuest && !ctx.auth.userId) return null;
      const user = ctx.db.users.all().find(u => u.clerkId === ctx.auth.userId);
      if (!user) {
        return {
          clerkId: ctx.auth.userId,
          displayName: ctx.auth.displayName || "Anonymous",
          onboardingComplete: false
        };
      }
      return user;
    }),
    getUserByUsername: query((ctx, username: string) => {
      if (!username) return null;
      return ctx.db.users.all().find(u => u.username === username) || null;
    }),
    getProjectByOwnerAndName: query((ctx, ownerUsername: string, projectName: string) => {
      if (!ownerUsername || !projectName) return null;
      const owner = ctx.db.users.all().find(u => u.username === ownerUsername);
      if (!owner) return null;
      const project = ctx.db.files.all().find(f => {
        const props = f.properties ? JSON.parse(f.properties) : {};
        return f.type === "dir" && props.kind === "project" && f.ownerId === owner.clerkId && f.name === projectName;
      });
      if (!project) return null;
      const props = project.properties ? JSON.parse(project.properties) : {};
      if (project.ownerId !== ctx.auth.userId && props["role:public"] !== "read") return null;
      return project;
    }),
    /** Count files in a project for display */
    countProjectFiles: query((ctx, projectId: string) => {
      if (!projectId) return 0;
      return ctx.db.files.where("parentId", projectId).all().length;
    })
  },

  mutations: {
    createProject: mutation((ctx, name: string) => {
      if (!name) return;
      return ctx.db.files.insert({
        name,
        type: "dir",
        parentId: "",
        mime: "",
        properties: JSON.stringify({ kind: "project" }),
        currentVersionId: "",
        ownerId: ctx.auth.userId,
        forked: false
      });
    }),
    createFile: mutation((ctx, name: string, type: string, parentId?: string) => {
      if (!name) return;
      return ctx.db.files.insert({
        name,
        type,
        parentId: parentId ?? "",
        mime: "",
        properties: JSON.stringify({}),
        currentVersionId: "",
        ownerId: ctx.auth.userId,
        forked: false
      });
    }),
    updateContent: mutation((ctx, fileId: string, content: string) => {
      if (!fileId) return;
      const file = ctx.db.files.get(fileId);
      if (!file || file.ownerId !== ctx.auth.userId) return;
      const versionId = ctx.db.versions.insert({
        fileId,
        content,
        authorId: ctx.auth.userId,
        parentVersionIds: "[]"
      });
      const { id, createdAt, updatedAt, ...rest } = file;
      ctx.db.files.update(fileId, { ...rest, currentVersionId: versionId });
      return versionId;
    }),
    mergeContent: mutation((ctx, fileId: string, content: string, parentVersionIds: string[]) => {
      if (!fileId) return;
      const file = ctx.db.files.get(fileId);
      if (!file || file.ownerId !== ctx.auth.userId) return;
      const versionId = ctx.db.versions.insert({
        fileId,
        content,
        authorId: ctx.auth.userId,
        parentVersionIds: JSON.stringify(parentVersionIds)
      });
      const { id, createdAt, updatedAt, ...rest } = file;
      ctx.db.files.update(fileId, { ...rest, currentVersionId: versionId, forked: false });
      return versionId;
    }),
    rollbackToVersion: mutation((ctx, fileId: string, versionId: string) => {
      const version = ctx.db.versions.get(versionId);
      if (!version || version.fileId !== fileId) throw new Error("Invalid version");
      const file = ctx.db.files.get(fileId);
      if (!file || file.ownerId !== ctx.auth.userId) throw new Error("Not authorized");
      const { id, createdAt, updatedAt, ...rest } = file;
      ctx.db.files.update(fileId, { ...rest, currentVersionId: versionId });
    }),
    forkFile: mutation((ctx, fileId: string) => {
      const file = ctx.db.files.get(fileId);
      if (!file || file.ownerId !== ctx.auth.userId) return;
      const { id, createdAt, updatedAt, ...rest } = file;
      ctx.db.files.update(fileId, { ...rest, forked: true });
    }),
    togglePublic: mutation((ctx, fileId: string) => {
      const file = ctx.db.files.get(fileId);
      if (!file || file.ownerId !== ctx.auth.userId) return;
      const props = file.properties ? JSON.parse(file.properties) : {};
      const newRole = props["role:public"] === "read" ? undefined : "read";
      const { id, createdAt, updatedAt, ...rest } = file;
      ctx.db.files.update(fileId, { 
        ...rest,
        properties: JSON.stringify({ ...props, "role:public": newRole }) 
      });
    }),
    /** Delete a file and all its versions */
    deleteFile: mutation((ctx, fileId: string) => {
      const file = ctx.db.files.get(fileId);
      if (!file || file.ownerId !== ctx.auth.userId) throw new Error("Not authorized");
      // Delete all versions first
      const versions = ctx.db.versions.where("fileId", fileId).all();
      for (const v of versions) {
        ctx.db.versions.delete(v.id);
      }
      // Delete children if it's a directory
      if (file.type === "dir") {
        const children = ctx.db.files.where("parentId", fileId).all();
        for (const child of children) {
          // Recursively delete child versions
          const childVersions = ctx.db.versions.where("fileId", child.id).all();
          for (const cv of childVersions) {
            ctx.db.versions.delete(cv.id);
          }
          ctx.db.files.delete(child.id);
        }
      }
      ctx.db.files.delete(fileId);
    }),
    /** Rename a file or directory */
    renameFile: mutation((ctx, fileId: string, newName: string) => {
      if (!newName.trim()) throw new Error("Name cannot be empty");
      const file = ctx.db.files.get(fileId);
      if (!file || file.ownerId !== ctx.auth.userId) throw new Error("Not authorized");
      const { id, createdAt, updatedAt, ...rest } = file;
      ctx.db.files.update(fileId, { ...rest, name: newName.trim() });
    }),
    /** Fork (copy) a public project to the current user */
    forkProject: mutation((ctx, projectId: string) => {
      const source = ctx.db.files.get(projectId);
      if (!source) throw new Error("Project not found");
      const props = source.properties ? JSON.parse(source.properties) : {};
      if (source.ownerId !== ctx.auth.userId && props["role:public"] !== "read") {
        throw new Error("Not authorized");
      }
      // Create a new project owned by current user
      const newProjectId = ctx.db.files.insert({
        name: source.name,
        type: "dir",
        parentId: "",
        mime: "",
        properties: JSON.stringify({ kind: "project" }),
        currentVersionId: "",
        ownerId: ctx.auth.userId,
        forked: false
      });
      // Copy all files in the project
      const children = ctx.db.files.where("parentId", projectId).all();
      for (const child of children) {
        const newFileId = ctx.db.files.insert({
          name: child.name,
          type: child.type,
          parentId: newProjectId,
          mime: child.mime || "",
          properties: JSON.stringify({}),
          currentVersionId: "",
          ownerId: ctx.auth.userId,
          forked: false
        });
        // Copy latest version content
        if (child.currentVersionId) {
          const version = ctx.db.versions.get(child.currentVersionId);
          if (version) {
            const newVersionId = ctx.db.versions.insert({
              fileId: newFileId,
              content: version.content,
              authorId: ctx.auth.userId,
              parentVersionIds: "[]"
            });
            const { id, createdAt, updatedAt, ...rest } = ctx.db.files.get(newFileId)!;
            ctx.db.files.update(newFileId, { ...rest, currentVersionId: newVersionId });
          }
        }
      }
      return newProjectId;
    }),
    /** Delete a project and all its children */
    deleteProject: mutation((ctx, projectId: string) => {
      const project = ctx.db.files.get(projectId);
      if (!project || project.ownerId !== ctx.auth.userId) throw new Error("Not authorized");
      const props = project.properties ? JSON.parse(project.properties) : {};
      if (props.kind !== "project") throw new Error("Not a project");
      // Delete all children and their versions
      const children = ctx.db.files.where("parentId", projectId).all();
      for (const child of children) {
        const versions = ctx.db.versions.where("fileId", child.id).all();
        for (const v of versions) ctx.db.versions.delete(v.id);
        ctx.db.files.delete(child.id);
      }
      // Delete project-level versions
      const projVersions = ctx.db.versions.where("fileId", projectId).all();
      for (const v of projVersions) ctx.db.versions.delete(v.id);
      ctx.db.files.delete(projectId);
    }),
    updateUsername: mutation((ctx, username: string) => {
      const user = ctx.db.users.all().find(u => u.clerkId === ctx.auth.userId);
      if (!user) {
        ctx.db.users.insert({
          clerkId: ctx.auth.userId,
          email: "",
          displayName: ctx.auth.displayName || "Anonymous",
          username,
          accountFileId: "",
          onboardingComplete: true,
          usernameChangeCount: "0"
        });
        return;
      }
      const { id, createdAt, updatedAt, ...rest } = user;
      ctx.db.users.update(user.id, { ...rest, username, onboardingComplete: true });
    })
  },

  endpoints: {}
});
