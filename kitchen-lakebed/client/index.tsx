import { Link, Route, Router, Routes, SignInWithGoogle, signOut, useAuth, useMutation, useParams, useQuery, useNavigate } from "lakebed/client";
import { useState, useEffect, useRef } from "preact/hooks";

// ----- Types -----
type FileDoc = { id: string; name: string; type: string; parentId: string; properties?: any; ownerId: string; currentVersionId?: string; forked?: boolean; createdAt: string; updatedAt: string; };
type VersionDoc = { id: string; fileId: string; content: string; authorId: string; parentVersionIds?: string; createdAt: string; updatedAt: string; };
type UserDoc = { id: string; clerkId: string; username?: string; onboardingComplete: boolean; displayName?: string; };

// ----- Toast System -----
type Toast = { id: string; type: "success" | "error" | "info" | "warning"; title: string; message?: string; };
let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function addToast(type: Toast["type"], title: string, message?: string) {
  const id = Math.random().toString(36).slice(2);
  const toast: Toast = { id, type, title, message };
  toasts = [...toasts, toast];
  toastListeners.forEach(fn => fn(toasts));
  setTimeout(() => removeToast(id), 4000);
}
function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  toastListeners.forEach(fn => fn(toasts));
}

function ToastContainer() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    toastListeners.push(setItems);
    return () => { toastListeners = toastListeners.filter(fn => fn !== setItems); };
  }, []);

  if (items.length === 0) return null;
  const icons: Record<string, string> = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };
  const borderColors: Record<string, string> = { success: "border-l-emerald-500", error: "border-l-red-500", info: "border-l-blue-500", warning: "border-l-amber-500" };
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {items.map(t => (
        <div key={t.id} className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl bg-white border border-stone-200 shadow-lg border-l-4 ${borderColors[t.type]} animate-in slide-in-from-right duration-300`}>
          <span className="text-sm mt-0.5 flex-shrink-0">{icons[t.type]}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-stone-800">{t.title}</div>
            {t.message && <div className="text-xs text-stone-500 mt-0.5">{t.message}</div>}
          </div>
          <button className="text-stone-400 hover:text-stone-700 text-xs p-0.5 rounded transition-colors flex-shrink-0" onClick={() => removeToast(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ----- Modal -----
function Modal({ open, title, description, onConfirm, onCancel, confirmLabel, danger }: {
  open: boolean; title: string; description: string;
  onConfirm: () => void; onCancel: () => void;
  confirmLabel?: string; danger?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9000] bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-[calc(100%-2rem)] p-6 animate-in zoom-in-95 duration-250" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-stone-900 mb-2">{title}</h3>
        <p className="text-sm text-stone-500 mb-5 leading-relaxed">{description}</p>
        <div className="flex gap-2 justify-end">
          <button className="px-4 py-2 rounded-lg border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors" onClick={onCancel}>Cancel</button>
          <button className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:-translate-y-px hover:shadow-md ${danger ? "bg-red-600 hover:bg-red-500" : "bg-stone-900 hover:bg-stone-800"}`} onClick={onConfirm}>
            {confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----- Loading Skeletons -----
function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 bg-[length:200%_100%] animate-pulse rounded-md ${className || ""}`} />;
}

function ProjectSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="border border-stone-200 rounded-xl p-5 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/5 mb-2" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

function FileSkeleton() {
  return (
    <div className="border border-stone-200 rounded-xl bg-white overflow-hidden shadow-sm">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 last:border-0">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className={`h-4 rounded`} style={{ width: `${35 + i * 12}%` }} />
        </div>
      ))}
    </div>
  );
}

// ----- UI Components -----
function AuthAvatar({ label, picture }: { label: string; picture?: string }) {
  const initial = label.trim().slice(0, 1).toUpperCase() || "?";
  if (picture) return <img alt="" className="h-8 w-8 shrink-0 rounded-full border border-stone-200 bg-white object-cover" referrerPolicy="no-referrer" src={picture} />;
  return <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-xs font-semibold text-stone-600">{initial}</span>;
}

function Kbd({ children }: { children: string }) {
  return <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-stone-500 bg-stone-100 border border-stone-200 rounded">{children}</kbd>;
}

function AppSidebar() {
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
}

// ----- Onboarding -----
function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const updateUsername = useMutation<[username: string], void>("updateUsername");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const val = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!val || submitting) return;
    if (val.length < 3) { setError("Username must be at least 3 characters"); return; }
    setSubmitting(true);
    setError("");
    try {
      await updateUsername(val);
      addToast("success", "Welcome!", "Your account is ready.");
      setTimeout(() => onComplete(), 300);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <main className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 p-4">
      <form onSubmit={(e) => void handleSubmit(e)} className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full">
        <h1 className="text-2xl font-extrabold tracking-tight mb-2">Welcome to Kitchen</h1>
        <p className="text-stone-500 mb-7 text-sm leading-relaxed">
          Pick a username to get started. This is how others will find your projects.
        </p>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}
        <div className="mb-6">
          <label className="block text-sm font-medium text-stone-700 mb-2">Username</label>
          <input
            autoFocus
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-mono outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 transition-all"
            value={username}
            onInput={e => setUsername(e.currentTarget.value)}
            placeholder="e.g. alice"
            disabled={submitting}
          />
          {username.trim() && (
            <p className="text-xs text-stone-400 mt-2">
              Your projects will be at <strong className="text-stone-600">kitchen.app/{username.trim().toLowerCase()}</strong>
            </p>
          )}
        </div>
        <button type="submit" disabled={!username.trim() || submitting} className="w-full rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50 transition-all hover:-translate-y-px hover:shadow-md">
          {submitting ? "Saving..." : "Continue"}
        </button>
      </form>
    </main>
  );
}

// ----- Pages -----

function ProjectList() {
  const projects = useQuery<FileDoc[]>("listProjects");
  const currentUser = useQuery<UserDoc | null>("getCurrentUser");
  const createProject = useMutation<[name: string], any>("createProject");
  const deleteProject = useMutation<[projectId: string], void>("deleteProject");
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FileDoc | null>(null);

  async function handleCreate(e: SubmitEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const name = String(new FormData(form).get("name") ?? "").trim();
    if (name && currentUser?.username) {
      await createProject(name);
      setIsCreating(false);
      addToast("success", "Project created", `"${name}" is ready to use.`);
      navigate(`/${currentUser.username}/${name}`);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteProject(deleteTarget.id);
      addToast("success", "Project deleted", `"${deleteTarget.name}" has been removed.`);
    } catch (err: any) {
      addToast("error", "Delete failed", err.message);
    }
    setDeleteTarget(null);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !(e.target as any)?.matches?.("input,textarea,select")) {
        e.preventDefault();
        setIsCreating(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
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
  );
}

function ProjectGrid({ projects, onDelete }: { projects: FileDoc[]; onDelete: (p: FileDoc) => void }) {
  const currentUser = useQuery<UserDoc | null>("getCurrentUser");
  const auth = useAuth();

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">
      {projects.map((proj) => {
        const ownerName = currentUser?.username || "_";
        const props = proj.properties ? JSON.parse(proj.properties) : {};
        const isPublic = props["role:public"] === "read";
        const isOwner = proj.ownerId === auth.userId;

        return (
          <li key={proj.id} className="group">
            <Link to={`/${ownerName}/${proj.name}`} className="block h-full rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-stone-400 hover:shadow-md hover:-translate-y-0.5 no-underline text-stone-900">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center text-xl shrink-0">📦</div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-base truncate text-stone-900">{proj.name}</h2>
                  <div className="flex items-center gap-2 text-xs text-stone-400">
                    <span>{new Date(proj.createdAt).toLocaleDateString()}</span>
                    {isPublic && <span className="rounded bg-green-100 text-green-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">Public</span>}
                  </div>
                </div>
              </div>
            </Link>
            {isOwner && (
              <div className="flex justify-end pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-xs text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer px-2 py-1 rounded hover:bg-red-50 transition-all" onClick={() => onDelete(proj)}>
                  Delete
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ProjectExplorerRoute() {
  const { owner, project } = useParams<{ owner: string; project: string }>();
  return <ProjectExplorer ownerUsername={owner} projectName={project} />;
}

function ProjectExplorer({ ownerUsername, projectName }: { ownerUsername: string; projectName: string }) {
  const project = useQuery<FileDoc | null>("getProjectByOwnerAndName", ownerUsername, projectName);
  const auth = useAuth();
  const navigate = useNavigate();

  const files = useQuery<FileDoc[]>("listTree", project?.id ?? "");

  const createFile = useMutation<[name: string, type: string, parentId?: string], any>("createFile");
  const togglePublic = useMutation<[fileId: string], void>("togglePublic");
  const deleteFile = useMutation<[fileId: string], void>("deleteFile");
  const renameFile = useMutation<[fileId: string, newName: string], void>("renameFile");
  const forkProject = useMutation<[projectId: string], any>("forkProject");

  const [isCreating, setIsCreating] = useState(false);
  const [createType, setCreateType] = useState("file");
  const [deleteTarget, setDeleteTarget] = useState<FileDoc | null>(null);
  const [renameTarget, setRenameTarget] = useState<FileDoc | null>(null);
  const [renameValue, setRenameValue] = useState("");

  async function handleCreate(e: SubmitEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const name = String(new FormData(form).get("name") ?? "").trim();
    if (name && project) {
      await createFile(name, createType, project.id);
      setIsCreating(false);
      addToast("success", `${createType === "dir" ? "Folder" : "File"} created`, `"${name}" has been created.`);
    }
  }

  async function handleDeleteFile() {
    if (!deleteTarget) return;
    try {
      await deleteFile(deleteTarget.id);
      addToast("success", "Deleted", `"${deleteTarget.name}" has been removed.`);
    } catch (err: any) {
      addToast("error", "Delete failed", err.message);
    }
    setDeleteTarget(null);
  }

  async function handleRename(e: SubmitEvent) {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    try {
      await renameFile(renameTarget.id, renameValue.trim());
      addToast("success", "Renamed", `File renamed to "${renameValue.trim()}".`);
    } catch (err: any) {
      addToast("error", "Rename failed", err.message);
    }
    setRenameTarget(null);
  }

  async function handleFork() {
    if (!project) return;
    try {
      await forkProject(project.id);
      addToast("success", "Project forked", `"${project.name}" has been copied to your account.`);
      navigate("/");
    } catch (err: any) {
      addToast("error", "Fork failed", err.message);
    }
  }

  if (project === undefined || files === undefined) {
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
  );
}

function FileViewerRoute() {
  const { owner, project, file } = useParams<{ owner: string; project: string; file: string }>();
  return <FileViewerPage ownerUsername={owner} projectName={project} fileName={file} />;
}

function FileViewerPage({ ownerUsername, projectName, fileName }: { ownerUsername: string; projectName: string; fileName: string }) {
  const project = useQuery<FileDoc | null>("getProjectByOwnerAndName", ownerUsername, projectName);
  const files = useQuery<FileDoc[]>("listTree", project?.id ?? "");
  const file = files?.find(f => f.name === fileName && f.type === "file") ?? null;
  const fileId = file?.id ?? "";

  const versions = useQuery<VersionDoc[]>("getVersions", fileId);
  const auth = useAuth();

  const rollbackToVersion = useMutation<[fileId: string, versionId: string], void>("rollbackToVersion");
  const forkFile = useMutation<[fileId: string], void>("forkFile");
  const updateContent = useMutation<[fileId: string, content: string], void>("updateContent");

  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [rollbackTarget, setRollbackTarget] = useState<string | null>(null);
  const [showForkModal, setShowForkModal] = useState(false);

  const isOwner = file ? file.ownerId === auth.userId : false;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (e.key === "s" && (e.metaKey || e.ctrlKey) && isEditing) {
        e.preventDefault();
        void handleSave();
      }
      if (e.key === "e" && !isEditing && !target.matches("input,textarea,select") && isOwner) {
        e.preventDefault();
        const cv = versions?.find(v => v.id === file?.currentVersionId) || versions?.[0];
        setEditContent(cv?.content || "");
        setIsEditing(true);
      }
      if (e.key === "Escape" && isEditing) {
        setIsEditing(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isEditing, fileId, versions, isOwner]);

  async function handleSave() {
    if (!fileId || !isOwner) return;
    setSaveState("saving");
    try {
      await updateContent(fileId, editContent);
      setSaveState("saved");
      setIsEditing(false);
      addToast("success", "Saved", "New version committed.");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (err: any) {
      addToast("error", "Save failed", err.message);
      setSaveState("idle");
    }
  }

  if (project === undefined || files === undefined) {
    return (
      <main className="flex flex-col h-full bg-white">
        <div className="border-b border-stone-200 bg-stone-50 px-6 py-4">
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 p-6 border-r border-stone-200">
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
          <div className="w-72 bg-stone-50 p-4">
            <Skeleton className="h-4 w-24 mb-4" />
            {[1, 2, 3].map(i => (
              <div key={i} className="mb-4">
                <Skeleton className="h-3 w-4/5 mb-1.5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4 opacity-70">📄</div>
        <div className="text-base font-semibold text-stone-700 mb-1">File not found</div>
        <div className="text-sm text-stone-500 mb-4"><strong>{fileName}</strong> doesn't exist in this project.</div>
        <Link to={`/${ownerUsername}/${projectName}`} className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 no-underline transition-colors">Back to project</Link>
      </div>
    );
  }

  const activeVersion = compareVersionId
    ? versions?.find(v => v.id === compareVersionId)
    : versions?.find(v => v.id === file.currentVersionId) || versions?.[0];

  const currentVersion = versions?.find(v => v.id === file.currentVersionId) || versions?.[0];

  return (
    <main className="flex flex-col h-full bg-white">
      <header className="border-b border-stone-200 bg-stone-50 px-6 py-3.5 flex items-center justify-between shrink-0">
        <div>
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
        </div>
        <div className="flex items-center gap-2">
          {saveState !== "idle" && (
            <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-all ${saveState === "saving" ? "text-amber-800 bg-amber-100" : "text-green-800 bg-green-100"}`}>
              {saveState === "saving" ? "Saving..." : "✓ Saved"}
            </div>
          )}
          {isOwner && !file.forked && !isEditing && (
            <button className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 shadow-sm transition-all flex items-center gap-1.5" onClick={() => {
              setEditContent(currentVersion?.content || "");
              setIsEditing(true);
            }}>
              ✏️ Edit <Kbd>E</Kbd>
            </button>
          )}
          {isOwner && !file.forked && (
            <button className="text-sm text-stone-500 hover:text-stone-900 px-2 py-1 rounded hover:bg-stone-100 transition-all" onClick={() => setShowForkModal(true)}>
              🔀 Fork
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col border-r border-stone-200 bg-white p-6 overflow-y-auto">
          {compareVersionId && currentVersion && compareVersionId !== currentVersion.id ? (
            <div>
              <div className="bg-amber-50 text-amber-900 p-3 rounded-lg border border-amber-200 mb-4 flex justify-between items-center text-sm">
                <span>Viewing version from {new Date(activeVersion?.createdAt || 0).toLocaleString()}</span>
                <button className="rounded-md bg-amber-800 text-amber-50 px-3 py-1 text-xs hover:bg-amber-700 transition-colors" onClick={() => setRollbackTarget(compareVersionId)}>
                  Rollback
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 h-full min-h-[400px]">
                <div className="border border-stone-200 rounded-lg overflow-hidden flex flex-col">
                  <div className="p-2 border-b border-stone-200 bg-stone-50 font-mono text-xs font-semibold text-stone-600">Current (Head)</div>
                  <pre className="p-4 font-mono text-sm overflow-auto whitespace-pre-wrap text-stone-500 bg-stone-50 flex-1">{currentVersion.content}</pre>
                </div>
                <div className="border border-green-200 rounded-lg overflow-hidden flex flex-col">
                  <div className="p-2 border-b border-green-200 bg-green-50 font-mono text-xs font-semibold text-green-800">Selected Version</div>
                  <pre className="p-4 font-mono text-sm overflow-auto whitespace-pre-wrap text-green-900 bg-green-50/50 flex-1">{activeVersion?.content}</pre>
                </div>
              </div>
            </div>
          ) : isEditing ? (
            <div className="flex flex-col h-full gap-3">
              <textarea
                autoFocus
                className="flex-1 border border-stone-200 rounded-lg p-4 font-mono text-sm outline-none resize-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/8 transition-all min-h-[400px]"
                value={editContent}
                onInput={e => setEditContent(e.currentTarget.value)}
                placeholder="Enter file contents..."
              />
              <div className="flex gap-2 justify-end">
                <button className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors flex items-center gap-1.5" onClick={() => setIsEditing(false)}>
                  Cancel <Kbd>Esc</Kbd>
                </button>
                <button className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 transition-all flex items-center gap-1.5" onClick={() => void handleSave()}>
                  Save Commit <Kbd>⌘S</Kbd>
                </button>
              </div>
            </div>
          ) : (
            <pre className="font-mono text-sm leading-relaxed text-stone-800 whitespace-pre-wrap">
              {activeVersion?.content ?? <span className="text-stone-400 italic">Empty file — click Edit to add content.</span>}
            </pre>
          )}
        </div>

        <aside className="w-72 bg-stone-50 flex flex-col shrink-0">
          <div className="p-3.5 border-b border-stone-200 font-medium text-sm text-stone-900 flex justify-between items-center">
            <span>History / Blame</span>
            <span className="rounded bg-stone-100 text-stone-500 px-1.5 py-0.5 text-[10px] font-semibold">{versions?.length || 0}</span>
          </div>
          <ul className="flex-1 overflow-y-auto p-4 space-y-4 list-none m-0">
            {versions?.map((v, i) => {
              const isCurrent = v.id === currentVersion?.id;
              const isSelected = v.id === compareVersionId;
              const hasParents = v.parentVersionIds && v.parentVersionIds !== "[]";
              return (
                <li
                  key={v.id}
                  className={`relative pl-4 border-l-2 cursor-pointer transition-colors ${isSelected ? "border-blue-500" : isCurrent ? "border-stone-900" : "border-stone-200"} hover:border-stone-400`}
                  onClick={() => setCompareVersionId(isCurrent ? null : v.id)}
                >
                  <div className={`absolute w-2 h-2 rounded-full -left-[5px] top-1.5 ${isSelected ? "bg-blue-500" : isCurrent ? "bg-stone-900" : "bg-stone-300"}`} />
                  <p className="text-xs font-semibold text-stone-900 mb-0.5">
                    {isCurrent ? "Current Version" : `Version ${(versions?.length ?? 0) - i}`}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {new Date(v.createdAt).toLocaleString()}
                  </p>
                  {hasParents && (
                    <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Merge Commit</p>
                  )}
                </li>
              );
            })}
            {(!versions || versions.length === 0) && (
              <p className="text-sm text-stone-500 italic">No history yet</p>
            )}
          </ul>
        </aside>
      </div>

      <Modal
        open={!!rollbackTarget}
        title="Rollback to this version?"
        description="This will set the selected version as the current head. The old head will still be in history."
        confirmLabel="Rollback"
        onConfirm={async () => {
          if (rollbackTarget) {
            try {
              await rollbackToVersion(fileId, rollbackTarget);
              setCompareVersionId(null);
              addToast("success", "Rolled back", "Version restored successfully.");
            } catch (err: any) {
              addToast("error", "Rollback failed", err.message);
            }
          }
          setRollbackTarget(null);
        }}
        onCancel={() => setRollbackTarget(null)}
      />

      <Modal
        open={showForkModal}
        title="Fork this file?"
        description="Marking a file as forked indicates parallel edits need to be resolved. Use the merge view to combine changes."
        confirmLabel="Fork"
        onConfirm={async () => {
          try {
            await forkFile(fileId);
            addToast("info", "File forked", "Use the merge view to resolve changes.");
          } catch (err: any) {
            addToast("error", "Fork failed", err.message);
          }
          setShowForkModal(false);
        }}
        onCancel={() => setShowForkModal(false)}
      />
    </main>
  );
}

function MergeViewRoute() {
  const { owner, project, file } = useParams<{ owner: string; project: string; file: string }>();
  return <MergeViewPage ownerUsername={owner} projectName={project} fileName={file} />;
}

function MergeViewPage({ ownerUsername, projectName, fileName }: { ownerUsername: string; projectName: string; fileName: string }) {
  const project = useQuery<FileDoc | null>("getProjectByOwnerAndName", ownerUsername, projectName);
  const files = useQuery<FileDoc[]>("listTree", project?.id ?? "");
  const file = files?.find(f => f.name === fileName && f.type === "file") ?? null;
  const fileId = file?.id ?? "";

  const versions = useQuery<VersionDoc[]>("getVersions", fileId);
  const mergeContent = useMutation<[fileId: string, content: string, parentVersionIds: string[]], void>("mergeContent");
  const navigate = useNavigate();

  const [mergedContent, setMergedContent] = useState("");

  if (!file || !versions || versions.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4 opacity-70">🔀</div>
        <div className="text-base font-semibold text-stone-700 mb-1">Loading merge view...</div>
        <div className="text-sm text-stone-500">Waiting for file and version data.</div>
      </div>
    );
  }

  const v1 = versions[0];
  const v2 = versions[1];

  async function handleMerge() {
    try {
      await mergeContent(fileId, mergedContent || v1.content, [v1.id, v2.id]);
      addToast("success", "Merged", "Changes have been combined.");
      navigate(`/${ownerUsername}/${projectName}/${fileName}`);
    } catch (err: any) {
      addToast("error", "Merge failed", err.message);
    }
  }

  return (
    <main className="flex flex-col h-full bg-white">
      <header className="border-b border-stone-200 bg-stone-50 px-6 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🔀</span>
          <h1 className="text-base font-bold text-stone-900">Merge: {file.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link to={`/${ownerUsername}/${projectName}/${fileName}`} className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 no-underline transition-all">Cancel</Link>
          <button className="rounded-lg bg-stone-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-stone-800 transition-all" onClick={() => void handleMerge()}>Commit Merge</button>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 flex gap-4 p-4 bg-stone-100 overflow-hidden">
          <div className="flex-1 bg-white border border-stone-200 rounded-lg flex flex-col overflow-hidden">
            <div className="p-2.5 border-b border-stone-200 bg-stone-50 font-mono text-xs font-semibold text-stone-600">Head A (Latest)</div>
            <pre className="p-4 font-mono text-sm overflow-auto text-stone-800 flex-1">{v1.content}</pre>
          </div>
          <div className="flex-1 bg-white border border-stone-200 rounded-lg flex flex-col overflow-hidden">
            <div className="p-2.5 border-b border-stone-200 bg-stone-50 font-mono text-xs font-semibold text-stone-600">Head B (Previous)</div>
            <pre className="p-4 font-mono text-sm overflow-auto text-stone-800 flex-1">{v2.content}</pre>
          </div>
        </div>
        <div className="h-60 border-t border-stone-300 bg-white p-4 flex flex-col shrink-0">
          <div className="font-semibold text-sm text-stone-900 mb-2">Composed Result</div>
          <textarea
            className="flex-1 border border-stone-200 rounded-lg p-3 font-mono text-sm outline-none resize-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/8 transition-all"
            value={mergedContent || v1.content}
            onInput={e => setMergedContent(e.currentTarget.value)}
            placeholder="Edit final merged content here..."
          />
        </div>
      </div>
    </main>
  );
}

// ----- Entrypoint -----
export function App() {
  const auth = useAuth();
  const currentUser = useQuery<UserDoc | null>("getCurrentUser");
  const [justCompleted, setJustCompleted] = useState(false);

  if (auth.isLoading || currentUser === undefined) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-stone-200 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-stone-500 text-sm">Loading Kitchen...</p>
        </div>
      </div>
    );
  }

  const needsOnboarding = !auth.isGuest && currentUser && !currentUser.onboardingComplete && !justCompleted;

  if (needsOnboarding) {
    return (
      <>
        <ToastContainer />
        <OnboardingPage onComplete={() => setJustCompleted(true)} />
      </>
    );
  }

  return (
    <Router>
      <div className="flex h-screen bg-stone-50 text-stone-900 overflow-hidden">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-y-auto">
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/:owner/:project" element={<ProjectExplorerRoute />} />
            <Route path="/:owner/:project/:file" element={<FileViewerRoute />} />
            <Route path="/:owner/:project/:file/merge" element={<MergeViewRoute />} />
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-5xl mb-4 opacity-70">🗺️</div>
                <div className="text-lg font-bold text-stone-900 mb-2">404</div>
                <Link to="/" className="text-stone-500 hover:text-stone-900 transition-colors no-underline">Return home</Link>
              </div>
            } />
          </Routes>
        </div>
      </div>
      <ToastContainer />
    </Router>
  );
}
