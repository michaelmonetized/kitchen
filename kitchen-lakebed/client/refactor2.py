import sys

with open("/Users/michael/Projects/kitchen/kitchen-lakebed/client/index.tsx", "r") as f:
    content = f.read()

def replace_block(old, new, name):
    global content
    if old not in content:
        print(f"Failed to find {name} in content")
        # Try to find a substring to see where it breaks
        for line in old.split('\n'):
            if line not in content:
                print(f"Failed to find line: {repr(line)}")
                break
    else:
        content = content.replace(old, new)
        print(f"Successfully replaced {name}")

# 1. Replace AppSidebar
sidebar_old = """function AppSidebar() {
  const auth = useAuth();

  return (
    <aside className="flex w-64 flex-col border-r border-stone-200 bg-stone-100 p-4 shrink-0 overflow-y-auto">
      <Link to="/" className="flex items-center gap-2.5 px-2 mb-6 text-lg font-extrabold tracking-tight text-stone-900 no-underline">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-900 text-white text-sm">🍳</span>
        Kitchen
      </Link>
      <nav className="flex flex-col gap-0.5">
        <Link to="/" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-white hover:text-stone-900 transition-all no-underline">
          <span className="w-5 text-center">📦</span>
          Projects
        </Link>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-stone-400 cursor-default">
          <span className="w-5 text-center">⚙️</span>
          Settings
        </div>
      </nav>
      <div className="mt-auto pt-4 border-t border-stone-200">
        <div className="flex items-center gap-2.5">
          {!auth.isLoading && <AuthAvatar label={auth.displayName} picture={auth.picture} />}
          <div className="flex flex-col min-w-0">
            <span className="truncate text-sm font-medium text-stone-900">{auth.displayName}</span>
            {!auth.isLoading && !auth.isGuest ? (
              <button className="text-left text-xs text-stone-500 hover:text-stone-900 transition-colors bg-transparent border-none cursor-pointer p-0" onClick={() => signOut()}>Sign out</button>
            ) : null}
          </div>
        </div>
        {!auth.isLoading && auth.isGuest && (
          <div className="mt-3">
            <SignInWithGoogle className="w-full justify-center rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors" />
          </div>
        )}
      </div>
    </aside>
  );
}"""

sidebar_new = """function AppHeader({ title }: { title: string }) {
  const auth = useAuth();
  return (
    <header className="flex h-14 items-center justify-between border-b border-stone-200 bg-white px-6 shrink-0">
      <h1 className="text-sm font-medium text-stone-900">{title}</h1>
      <div className="flex items-center gap-2">
        {!auth.isLoading && !auth.isGuest ? (
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium text-stone-900">{auth.displayName}</span>
            <button className="text-xs text-stone-500 hover:text-stone-900 transition-colors bg-transparent border-none cursor-pointer p-0" onClick={() => signOut()}>Sign out</button>
            <AuthAvatar label={auth.displayName} picture={auth.picture} />
          </div>
        ) : (
          !auth.isLoading && auth.isGuest && (
            <SignInWithGoogle className="justify-center rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors" />
          )
        )}
      </div>
    </header>
  );
}

function AppSidebar() {
  return (
    <aside className="flex w-56 flex-col border-r border-stone-200 bg-stone-100 p-4 shrink-0 overflow-y-auto">
      <Link to="/" className="text-lg font-semibold text-stone-900 no-underline">
        Kitchen
      </Link>
      <nav className="mt-8 flex flex-col gap-2 text-sm">
        <Link to="/" className="rounded-md px-2 py-1.5 text-stone-500 hover:bg-white hover:text-stone-900 transition-colors no-underline">
          Projects
        </Link>
        <Link to="/account" className="rounded-md px-2 py-1.5 text-stone-500 hover:bg-white hover:text-stone-900 transition-colors no-underline">
          Account
        </Link>
        <Link to="/settings" className="rounded-md px-2 py-1.5 text-stone-500 hover:bg-white hover:text-stone-900 transition-colors no-underline">
          Settings
        </Link>
        <Link to="/discover" className="rounded-md px-2 py-1.5 text-stone-500 hover:bg-white hover:text-stone-900 transition-colors no-underline">
          Discover
        </Link>
      </nav>
    </aside>
  );
}"""
replace_block(sidebar_old, sidebar_new, "AppSidebar")

project_list_old = """  return (
    <main className="p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Projects</h1>
          <p className="text-sm text-stone-500 mt-1">Your files, version-controlled and live.</p>
        </div>
        <div className="flex items-center gap-2">
          <Kbd>N</Kbd>
          <button className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 transition-all hover:-translate-y-px hover:shadow-md" onClick={() => setIsCreating(true)}>
            New Project
          </button>
        </div>
      </div>

      {isCreating && (
        <form onSubmit={(e) => void handleCreate(e)} className="mb-6 p-5 rounded-xl border border-stone-200 bg-white shadow-sm flex gap-3 items-center">
          <input autoFocus name="name" placeholder="Project name..." className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 transition-all" />
          <button type="button" onClick={() => setIsCreating(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors">Cancel</button>
          <button type="submit" className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 transition-all">Create</button>
        </form>
      )}

      {projects === undefined ? (
        <ProjectSkeleton />
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4 opacity-70">📦</div>
          <div className="text-base font-semibold text-stone-700 mb-1">No projects yet</div>
          <div className="text-sm text-stone-500 max-w-xs">Create your first project to start cooking.</div>
        </div>
      ) : (
        <ProjectGrid projects={projects} onDelete={setDeleteTarget} />
      )}

      <Modal
        open={!!deleteTarget}
        title="Delete project?"
        description={`This will permanently delete "${deleteTarget?.name}" and all its files. This cannot be undone.`}
        confirmLabel="Delete Project"
        danger
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );"""

project_list_new = """  return (
    <>
      <AppHeader title="Projects" />
      <main className="flex-1 p-6">
        <div className="mb-4">
          <button className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 transition-all" onClick={() => setIsCreating(true)}>
            New Project
          </button>
        </div>
        {isCreating && (
          <form onSubmit={(e) => void handleCreate(e)} className="mb-6 p-5 rounded-xl border border-stone-200 bg-white shadow-sm flex gap-3 items-center">
            <input autoFocus name="name" placeholder="Project name..." className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 transition-all" />
            <button type="button" onClick={() => setIsCreating(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors">Cancel</button>
            <button type="submit" className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 transition-all">Create</button>
          </form>
        )}
        {projects === undefined ? (
          <p className="text-stone-500">Loading projects…</p>
        ) : projects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center">
            <p className="text-stone-600">No projects yet.</p>
            <p className="mt-2 text-sm text-stone-500">Create your first project to start cooking.</p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 list-none p-0 m-0">
            {projects.map((proj) => {
              const ownerName = proj.ownerUsername || currentUser?.username || "_";
              return (
                <li key={proj.id}>
                  <Link
                    to={`/projects/${proj.id}`}
                    className="block rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-400 no-underline"
                  >
                    <p className="font-medium text-stone-900 m-0">{proj.name}</p>
                    <p className="text-sm text-stone-500 m-0 mt-1">{ownerName}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <Modal
          open={!!deleteTarget}
          title="Delete project?"
          description={`This will permanently delete "${deleteTarget?.name}" and all its files. This cannot be undone.`}
          confirmLabel="Delete Project"
          danger
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      </main>
    </>
  );"""

replace_block(project_list_old, project_list_new, "ProjectList UI")

filetree_code = """
function FileTreeNode({ projectId, node, childrenByParent }: { projectId: string; node: FileDoc; childrenByParent: Map<string, FileDoc[]> }) {
  const children = childrenByParent.get(node.id) ?? [];
  if (node.type === "file") {
    return (
      <li>
        <div className="flex items-center gap-1">
          <Link to={`/projects/${projectId}/files/${node.id}`} className="flex flex-1 items-center gap-2 rounded px-2 py-1 text-sm hover:bg-stone-100 no-underline text-stone-900">
            <span>{node.name}</span>
          </Link>
          {node.forked && (
            <Link to={`/projects/${projectId}/files/${node.id}/merge`} className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 hover:bg-amber-200 no-underline">
              fork
            </Link>
          )}
        </div>
      </li>
    );
  }
  return (
    <li>
      <details className="group">
        <summary className="cursor-pointer rounded px-2 py-1 text-sm hover:bg-stone-100 list-none font-medium text-stone-900">
          {node.name}/
        </summary>
        {children.length > 0 && (
          <ul className="ml-3 border-l border-stone-200 pl-2 list-none space-y-0.5 m-0 mt-0.5">
            {children.map(child => (
              <FileTreeNode key={child.id} projectId={projectId} node={child} childrenByParent={childrenByParent} />
            ))}
          </ul>
        )}
      </details>
    </li>
  );
}

function FileTree({ projectId }: { projectId: string }) {
  const tree = useQuery<FileDoc[]>("listProjectTree", projectId);
  if (tree === undefined) return <p className="text-sm text-stone-500">Loading tree…</p>;
  
  const childrenByParent = new Map<string, FileDoc[]>();
  for (const node of tree) {
    const siblings = childrenByParent.get(node.parentId) ?? [];
    siblings.push(node);
    childrenByParent.set(node.parentId, siblings);
  }
  const roots = childrenByParent.get(projectId) ?? [];
  return (
    <ul className="space-y-0.5 list-none m-0 p-0">
      {roots.map(child => (
        <FileTreeNode key={child.id} projectId={projectId} node={child} childrenByParent={childrenByParent} />
      ))}
    </ul>
  );
}
"""

project_explorer_old = """function ProjectExplorerRoute() {
  const { owner, project } = useParams<{ owner: string; project: string }>();
  return <ProjectExplorer ownerUsername={decodeURIComponent(owner ?? "")} projectName={decodeURIComponent(project ?? "")} />;
}

function ProjectExplorer({ ownerUsername, projectName }: { ownerUsername: string; projectName: string }) {
  const project = useQuery<FileDoc | null>("getProjectByOwnerAndName", ownerUsername, projectName);"""

project_explorer_new = filetree_code + """function ProjectExplorerRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  return <ProjectExplorer projectId={projectId ?? ""} />;
}

function ProjectExplorer({ projectId }: { projectId: string }) {
  const project = useQuery<FileDoc | null>("getFile", projectId);"""
replace_block(project_explorer_old, project_explorer_new, "ProjectExplorerRoute")

proj_exp_body_old = """  if (project === undefined || files === undefined) {
    return (
      <main className="flex flex-col h-full">
        <header className="border-b border-stone-200 bg-white px-8 py-4 flex items-center shrink-0">
          <Skeleton className="h-5 w-48" />
        </header>
        <div className="p-8 max-w-5xl mx-auto w-full">
          <FileSkeleton />
        </div>
      </main>
    );
  }

  if (project === null) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4 opacity-70">🔍</div>
        <div className="text-base font-semibold text-stone-700 mb-1">Project not found</div>
        <div className="text-sm text-stone-500 mb-4">
          <strong>{ownerUsername}/{projectName}</strong> doesn't exist or you don't have access.
        </div>
        <Link to="/" className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 no-underline transition-colors">Back to Projects</Link>
      </div>
    );
  }

  const isOwner = project.ownerId === auth.userId;
  const props = project.properties ? JSON.parse(project.properties as any) : {};
  const isPublic = props["role:public"] === "read";

  return (
    <main className="flex flex-col h-full">
      <header className="border-b border-stone-200 bg-white px-8 py-5 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-1.5 text-sm text-stone-500 mb-1">
            <Link to="/" className="hover:text-stone-900 transition-colors no-underline text-stone-500">Projects</Link>
            <span className="text-stone-300">/</span>
            <span className="text-stone-600 font-medium">{ownerUsername}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">{project.name}</h1>
            {isPublic && <span className="rounded bg-green-100 text-green-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">Public</span>}
            {!isOwner && <span className="rounded bg-stone-100 text-stone-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">Read-only</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isOwner && isPublic && (
            <button className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors" onClick={() => void handleFork()}>
              🍴 Fork
            </button>
          )}
          {isOwner && (
            <button className="text-sm font-medium text-stone-500 hover:text-stone-900 px-2 py-1 rounded hover:bg-stone-100 transition-all" onClick={() => void togglePublic(project.id)}>
              {isPublic ? "🔒 Private" : "🌐 Public"}
            </button>
          )}
          {isOwner && (
            <button className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 transition-all" onClick={() => { setIsCreating(true); setCreateType("file"); }}>
              New File
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto w-full">
        {isCreating && (
          <form onSubmit={(e) => void handleCreate(e)} className="mb-5 p-4 rounded-xl border border-stone-200 bg-white shadow-sm flex gap-2.5 items-center">
            <select value={createType} onChange={e => setCreateType(e.currentTarget.value)} className="rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors">
              <option value="file">📄 File</option>
              <option value="dir">📁 Folder</option>
            </select>
            <input autoFocus name="name" placeholder="Name..." className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 transition-all" />
            <button type="button" onClick={() => setIsCreating(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors">Cancel</button>
            <button type="submit" className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 transition-all">Create</button>
          </form>
        )}

        {files.length === 0 && !isCreating ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4 opacity-70">📂</div>
            <div className="text-base font-semibold text-stone-700 mb-1">This project is empty</div>
            <div className="text-sm text-stone-500">Create a file to get started.</div>
          </div>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <ul className="divide-y divide-stone-100 list-none m-0 p-0">
              {files.map(file => (
                <li key={file.id} className="group flex items-center justify-between p-4 hover:bg-stone-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-lg w-5 text-center shrink-0">{file.type === "dir" ? "📁" : "📄"}</span>
                    {renameTarget?.id === file.id ? (
                      <form onSubmit={(e) => void handleRename(e)} className="flex gap-1.5 flex-1">
                        <input
                          autoFocus
                          className="flex-1 rounded-md border border-stone-200 px-2 py-1 text-sm outline-none focus:border-stone-900 transition-colors"
                          value={renameValue}
                          onInput={e => setRenameValue(e.currentTarget.value)}
                          onKeyDown={e => { if (e.key === "Escape") setRenameTarget(null); }}
                        />
                        <button type="submit" className="rounded-md bg-stone-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-stone-800">Save</button>
                        <button type="button" className="text-xs text-stone-500 hover:text-stone-900 px-2 py-1 rounded hover:bg-stone-100 transition-all" onClick={() => setRenameTarget(null)}>Cancel</button>
                      </form>
                    ) : file.type === "dir" ? (
                      <Link to={`/${ownerUsername}/${file.name}`} className="font-medium text-sm text-stone-900 hover:text-indigo-600 transition-colors no-underline truncate">{file.name}</Link>
                    ) : (
                      <Link to={`/${ownerUsername}/${projectName}/${file.name}`} className="font-medium text-sm text-stone-900 hover:text-indigo-600 transition-colors no-underline truncate">{file.name}</Link>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isOwner && file.type === "file" && (
                      <button className="text-xs text-stone-500 hover:text-stone-900 px-2 py-1 rounded hover:bg-stone-100 transition-all" onClick={() => { setRenameTarget(file); setRenameValue(file.name); }}>Rename</button>
                    )}
                    {file.type === "file" && (
                      <Link to={`/${ownerUsername}/${projectName}/${file.name}`} className="rounded-md border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600 hover:border-stone-300 hover:text-stone-900 shadow-sm transition-all no-underline">
                        Open
                      </Link>
                    )}
                    {isOwner && (
                      <button className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-all bg-transparent border-none cursor-pointer" onClick={() => setDeleteTarget(file)}>✕</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Modal
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.type === "dir" ? "folder" : "file"}?`}
        description={`This will permanently delete "${deleteTarget?.name}". This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => void handleDeleteFile()}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );"""

proj_exp_body_new = """  if (project === undefined) {
    return <p className="text-stone-500 p-6">Loading project…</p>;
  }
  if (project === null) {
    return <p className="text-stone-500 p-6">Project not found.</p>;
  }

  const isOwner = project.ownerId === auth.userId;

  return (
    <>
      <AppHeader title="Project" />
      <main className="flex-1 p-6">
        <div className="mb-4 flex items-center gap-2">
          {isOwner && (
            <button className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 transition-all" onClick={() => { setIsCreating(true); setCreateType("file"); }}>
              New File
            </button>
          )}
        </div>
        {isCreating && (
          <form onSubmit={(e) => void handleCreate(e)} className="mb-5 p-4 rounded-xl border border-stone-200 bg-white shadow-sm flex gap-2.5 items-center">
            <select value={createType} onChange={e => setCreateType(e.currentTarget.value)} className="rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors">
              <option value="file">📄 File</option>
              <option value="dir">📁 Folder</option>
            </select>
            <input autoFocus name="name" placeholder="Name..." className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 transition-all" />
            <button type="button" onClick={() => setIsCreating(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors">Cancel</button>
            <button type="submit" className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 transition-all">Create</button>
          </form>
        )}
        <FileTree projectId={projectId} />
      </main>
      <Modal
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.type === "dir" ? "folder" : "file"}?`}
        description={`This will permanently delete "${deleteTarget?.name}". This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => void handleDeleteFile()}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );"""
replace_block(proj_exp_body_old, proj_exp_body_new, "ProjectExplorer body")

file_viewer_old = """function FileViewerRoute() {
  const { owner, project, file } = useParams<{ owner: string; project: string; file: string }>();
  return <FileViewerPage ownerUsername={decodeURIComponent(owner ?? "")} projectName={decodeURIComponent(project ?? "")} fileName={decodeURIComponent(file ?? "")} />;
}

function FileViewerPage({ ownerUsername, projectName, fileName }: { ownerUsername: string; projectName: string; fileName: string }) {
  const project = useQuery<FileDoc | null>("getProjectByOwnerAndName", ownerUsername, projectName);
  const files = useQuery<FileDoc[]>("listTree", project?.id ?? "");
  const file = files?.find(f => f.name === fileName && f.type === "file") ?? null;
  const fileId = file?.id ?? "";"""

file_viewer_new = """function FileViewerRoute() {
  const { projectId, fileId } = useParams<{ projectId: string; fileId: string }>();
  return <FileViewerPage projectId={projectId ?? ""} fileId={fileId ?? ""} />;
}

function FileViewerPage({ projectId, fileId }: { projectId: string; fileId: string }) {
  const project = useQuery<FileDoc | null>("getFile", projectId);
  const file = useQuery<FileDoc | null>("getFile", fileId);"""
replace_block(file_viewer_old, file_viewer_new, "FileViewerRoute")

file_viewer_header_old = """        <div>
          <div className="flex items-center gap-1.5 text-sm text-stone-500 font-mono">
            <Link to="/" className="hover:text-stone-900 transition-colors no-underline text-stone-500">~</Link>
            <span className="text-stone-300">/</span>
            <Link to={`/${ownerUsername}/${projectName}`} className="hover:text-stone-900 transition-colors no-underline text-stone-500">{projectName}</Link>
            <span className="text-stone-300">/</span>
            <span className="text-stone-900 font-semibold">{file.name}</span>
            {file.forked && (
              <Link to={`/${ownerUsername}/${projectName}/${fileName}/merge`} className="ml-2 rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider no-underline">
                Forked
              </Link>
            )}
          </div>
        </div>"""

file_viewer_header_new = """        <div>
          <div className="flex items-center gap-1.5 text-sm text-stone-500 font-mono">
            <Link to={`/projects/${projectId}`} className="hover:text-stone-900 transition-colors no-underline text-stone-500">Project</Link>
            <span className="text-stone-300">/</span>
            <span className="text-stone-900 font-semibold">{file?.name}</span>
            {file?.forked && (
              <Link to={`/projects/${projectId}/files/${fileId}/merge`} className="ml-2 rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider no-underline">
                Forked
              </Link>
            )}
          </div>
        </div>"""
replace_block(file_viewer_header_old, file_viewer_header_new, "FileViewer Header")

merge_view_old = """function MergeViewRoute() {
  const { owner, project, file } = useParams<{ owner: string; project: string; file: string }>();
  return <MergeViewPage ownerUsername={decodeURIComponent(owner ?? "")} projectName={decodeURIComponent(project ?? "")} fileName={decodeURIComponent(file ?? "")} />;
}

function MergeViewPage({ ownerUsername, projectName, fileName }: { ownerUsername: string; projectName: string; fileName: string }) {
  const project = useQuery<FileDoc | null>("getProjectByOwnerAndName", ownerUsername, projectName);
  const files = useQuery<FileDoc[]>("listTree", project?.id ?? "");
  const file = files?.find(f => f.name === fileName && f.type === "file") ?? null;
  const fileId = file?.id ?? "";"""

merge_view_new = """function MergeViewRoute() {
  const { projectId, fileId } = useParams<{ projectId: string; fileId: string }>();
  return <MergeViewPage projectId={projectId ?? ""} fileId={fileId ?? ""} />;
}

function MergeViewPage({ projectId, fileId }: { projectId: string; fileId: string }) {
  const project = useQuery<FileDoc | null>("getFile", projectId);
  const file = useQuery<FileDoc | null>("getFile", fileId);"""
replace_block(merge_view_old, merge_view_new, "MergeViewRoute")

replace_block("""<Link to={`/${ownerUsername}/${projectName}/${fileName}`} className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 no-underline transition-all">Cancel</Link>""", """<Link to={`/projects/${projectId}/files/${fileId}`} className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 no-underline transition-all">Cancel</Link>""", "MergeView Cancel Link")
replace_block("""navigate(`/${ownerUsername}/${projectName}/${fileName}`);""", """navigate(`/projects/${projectId}/files/${fileId}`);""", "MergeView Navigate")

file_viewer_error_link_old = """<Link to={`/${ownerUsername}/${projectName}`} className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 no-underline transition-colors">Back to project</Link>"""
file_viewer_error_link_new = """<Link to={`/projects/${projectId}`} className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 no-underline transition-colors">Back to project</Link>"""
replace_block(file_viewer_error_link_old, file_viewer_error_link_new, "FileViewer Error Link")

merge_view_header_old = """          <h1 className="text-base font-bold text-stone-900">Merge: {file.name}</h1>"""
merge_view_header_new = """          <h1 className="text-base font-bold text-stone-900">Merge: {file?.name}</h1>"""
replace_block(merge_view_header_old, merge_view_header_new, "MergeView Header")

app_routes_old = """          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/:owner/:project" element={<ProjectExplorerRoute />} />
            <Route path="/:owner/:project/:file" element={<FileViewerRoute />} />
            <Route path="/:owner/:project/:file/merge" element={<MergeViewRoute />} />
            <Route path="*" element={"""
app_routes_new = """          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/projects/:projectId" element={<ProjectExplorerRoute />} />
            <Route path="/projects/:projectId/files/:fileId" element={<FileViewerRoute />} />
            <Route path="/projects/:projectId/files/:fileId/merge" element={<MergeViewRoute />} />
            <Route path="*" element={"""
replace_block(app_routes_old, app_routes_new, "App Routes")

with open("/Users/michael/Projects/kitchen/kitchen-lakebed/client/index.tsx", "w") as f:
    f.write(content)

