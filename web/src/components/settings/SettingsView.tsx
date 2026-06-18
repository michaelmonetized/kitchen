"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

type Tab = "organization" | "members" | "roles";

const PERMISSION_OPTIONS = ["read", "write", "admin"] as const;

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function SettingsView() {
  const orgs = useQuery(api.admin.listOrgsForUser, {});
  const [selectedOrgId, setSelectedOrgId] = useState<Id<"files"> | null>(null);
  const [tab, setTab] = useState<Tab>("organization");

  if (orgs === undefined) {
    return <p className="text-muted">Loading settings…</p>;
  }

  if (orgs.length === 0) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-8 text-center">
        <h2 className="text-lg font-medium text-stone-900">Access denied</h2>
        <p className="mt-2 text-sm text-stone-500">
          You are not a member of any organization.
        </p>
      </div>
    );
  }

  const activeOrgId = selectedOrgId ?? orgs[0].org._id;
  const selected = orgs.find((o) => o.org._id === activeOrgId) ?? orgs[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <label htmlFor="org-select" className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Organization
          </label>
          <select
            id="org-select"
            value={String(activeOrgId)}
            onChange={(e) => setSelectedOrgId(e.target.value as Id<"files">)}
            className="mt-1 block rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
          >
            {orgs.map(({ org, isAdmin }) => (
              <option key={String(org._id)} value={String(org._id)}>
                {org.name}
                {isAdmin ? "" : " (read-only)"}
              </option>
            ))}
          </select>
        </div>

        {!selected.isAdmin && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            Read-only — admin access required to make changes
          </span>
        )}
      </div>

      <nav className="flex gap-1 border-b border-stone-200">
        {(
          [
            ["organization", "Organization"],
            ["members", "Members"],
            ["roles", "Roles"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === id
                ? "border-b-2 border-stone-900 text-stone-900"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <OrgPanel orgId={selected.org._id} isAdmin={selected.isAdmin} tab={tab} />
    </div>
  );
}

function OrgPanel({
  orgId,
  isAdmin,
  tab,
}: {
  orgId: Id<"files">;
  isAdmin: boolean;
  tab: Tab;
}) {
  const context = useQuery(api.admin.getOrgContext, { orgId });

  if (context === undefined) {
    return <p className="text-stone-500">Loading organization…</p>;
  }

  if (context === null) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-8 text-center">
        <p className="text-stone-600">You do not have access to this organization.</p>
      </div>
    );
  }

  if (tab === "organization") {
    return <OrganizationTab context={context} isAdmin={isAdmin} />;
  }
  if (tab === "members") {
    return <MembersTab context={context} isAdmin={isAdmin} orgId={orgId} />;
  }
  return <RolesTab context={context} isAdmin={isAdmin} orgId={orgId} />;
}

type OrgContext = {
  org: { _id: Id<"files">; name: string; properties: Record<string, string> };
  isAdmin: boolean;
  roles: Array<{ _id: Id<"roles">; name: string; permissions: string[] }>;
  projects: Array<{
    _id: Id<"files">;
    name: string;
    properties?: Record<string, string>;
  }>;
  members: Array<{
    assignmentId: Id<"user_roles">;
    userId: Id<"users">;
    email: string;
    displayName?: string;
    roleId: Id<"roles">;
    roleName: string;
    projectFileId?: Id<"files">;
    projectName?: string;
  }>;
  userRoles: string[];
};

function OrganizationTab({
  context,
  isAdmin,
}: {
  context: OrgContext;
  isAdmin: boolean;
}) {
  const createOrg = useMutation(api.admin.createOrg);
  const createProject = useMutation(api.admin.createProject);
  const transferOwnership = useMutation(api.admin.transferProjectOwnership);
  const setProjectProperties = useMutation(api.admin.setProjectProperties);

  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [projectName, setProjectName] = useState("");
  const [transferEmail, setTransferEmail] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    try {
      await createOrg({ name: orgName, slug: orgSlug || slugify(orgName) });
      setOrgName("");
      setOrgSlug("");
      setStatus("Organization created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create org");
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    try {
      await createProject({ orgId: context.org._id, name: projectName });
      setProjectName("");
      setStatus("Project created with editor write and viewer read ACL.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    }
  }

  async function handleTransfer(projectId: Id<"files">) {
    const email = transferEmail[String(projectId)];
    if (!email) return;
    setError(null);
    setStatus(null);
    try {
      await transferOwnership({ projectId, newOwnerEmail: email });
      setTransferEmail((prev) => ({ ...prev, [String(projectId)]: "" }));
      setStatus("Ownership transferred.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    }
  }

  async function handleResetAcl(projectId: Id<"files">) {
    setError(null);
    try {
      await setProjectProperties({
        projectId,
        properties: {
          "role:editor": "write",
          "role:viewer": "read",
        },
      });
      setStatus("Project ACL reset to defaults.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update properties");
    }
  }

  return (
    <div className="space-y-8">
      {status && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{status}</p>
      )}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <h2 className="text-base font-semibold text-stone-900">{context.org.name}</h2>
        <p className="mt-1 text-sm text-stone-500">
          Your roles: {context.userRoles.join(", ") || "none"}
        </p>
        {isAdmin && (
          <dl className="mt-4 grid gap-2 text-sm">
            {Object.entries(context.org.properties).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <dt className="font-mono text-stone-500">{key}</dt>
                <dd className="text-stone-800">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {isAdmin && (
        <section className="rounded-lg border border-stone-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-stone-900">Create organization</h3>
          <form onSubmit={handleCreateOrg} className="mt-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-stone-600">Name</span>
              <input
                value={orgName}
                onChange={(e) => {
                  setOrgName(e.target.value);
                  if (!orgSlug) setOrgSlug(slugify(e.target.value));
                }}
                required
                className="rounded-md border border-stone-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-stone-600">Slug</span>
              <input
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                placeholder="acme-corp"
                className="rounded-md border border-stone-300 px-3 py-2 font-mono"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
            >
              Create org
            </button>
          </form>
        </section>
      )}

      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-stone-900">Projects</h3>
        {isAdmin && (
          <form onSubmit={handleCreateProject} className="mt-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-stone-600">Project name</span>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
                className="rounded-md border border-stone-300 px-3 py-2"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
            >
              Create project
            </button>
          </form>
        )}

        <ul className="mt-6 divide-y divide-stone-100">
          {context.projects.map((project) => (
            <li key={String(project._id)} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-stone-900">{project.name}</p>
                  {isAdmin && project.properties && (
                    <pre className="mt-2 rounded bg-stone-50 px-2 py-1 font-mono text-xs text-stone-600">
                      {JSON.stringify(project.properties, null, 2)}
                    </pre>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleResetAcl(project._id)}
                      className="text-xs text-stone-500 hover:text-stone-800"
                    >
                      Reset ACL defaults
                    </button>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="new owner email"
                        value={transferEmail[String(project._id)] ?? ""}
                        onChange={(e) =>
                          setTransferEmail((prev) => ({
                            ...prev,
                            [String(project._id)]: e.target.value,
                          }))
                        }
                        className="rounded-md border border-stone-300 px-2 py-1 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleTransfer(project._id)}
                        className="rounded-md border border-stone-300 px-3 py-1 text-sm hover:bg-stone-50"
                      >
                        Transfer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
          {context.projects.length === 0 && (
            <li className="py-4 text-sm text-stone-500">No projects yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

function MembersTab({
  context,
  isAdmin,
  orgId,
}: {
  context: OrgContext;
  isAdmin: boolean;
  orgId: Id<"files">;
}) {
  const inviteMember = useMutation(api.admin.inviteMember);
  const removeMember = useMutation(api.admin.removeMember);

  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    try {
      await inviteMember({
        orgId,
        email,
        roleId: roleId as Id<"roles">,
        projectFileId: projectId ? (projectId as Id<"files">) : undefined,
      });
      setEmail("");
      setStatus("Member invited and role assigned.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    }
  }

  async function handleRemove(assignmentId: Id<"user_roles">) {
    setError(null);
    try {
      await removeMember({ assignmentId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    }
  }

  return (
    <div className="space-y-6">
      {status && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{status}</p>
      )}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      {isAdmin && (
        <section className="rounded-lg border border-stone-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-stone-900">Invite member</h3>
          <form onSubmit={handleInvite} className="mt-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-stone-600">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-md border border-stone-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-stone-600">Role</span>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                required
                className="rounded-md border border-stone-300 px-3 py-2"
              >
                <option value="">Select role</option>
                {context.roles.map((role) => (
                  <option key={String(role._id)} value={String(role._id)}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-stone-600">Project scope (optional)</span>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="rounded-md border border-stone-300 px-3 py-2"
              >
                <option value="">Org-wide</option>
                {context.projects.map((project) => (
                  <option key={String(project._id)} value={String(project._id)}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
            >
              Invite
            </button>
          </form>
        </section>
      )}

      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-stone-900">Members</h3>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-stone-500">
              <th className="pb-2 font-medium">Email</th>
              <th className="pb-2 font-medium">Role</th>
              <th className="pb-2 font-medium">Scope</th>
              {isAdmin && <th className="pb-2 font-medium" />}
            </tr>
          </thead>
          <tbody>
            {context.members.map((member) => (
              <tr key={String(member.assignmentId)} className="border-b border-stone-100">
                <td className="py-2 text-stone-900">{member.email}</td>
                <td className="py-2 text-stone-700">{member.roleName}</td>
                <td className="py-2 text-stone-500">
                  {member.projectName ?? "Org-wide"}
                </td>
                {isAdmin && (
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(member.assignmentId)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {context.members.length === 0 && (
          <p className="mt-4 text-sm text-stone-500">No members found.</p>
        )}
      </section>
    </div>
  );
}

function RolesTab({
  context,
  isAdmin,
  orgId,
}: {
  context: OrgContext;
  isAdmin: boolean;
  orgId: Id<"files">;
}) {
  const createRole = useMutation(api.admin.createRole);
  const updateRole = useMutation(api.admin.updateRole);
  const deleteRole = useMutation(api.admin.deleteRole);

  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<string[]>(["read"]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function togglePermission(list: string[], perm: string, setter: (v: string[]) => void) {
    setter(list.includes(perm) ? list.filter((p) => p !== perm) : [...list, perm]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createRole({ orgId, name, permissions });
      setName("");
      setPermissions(["read"]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create role");
    }
  }

  async function handleUpdate(roleId: Id<"roles">) {
    setError(null);
    try {
      await updateRole({ roleId, permissions: editPermissions });
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  async function handleDelete(roleId: Id<"roles">) {
    setError(null);
    try {
      await deleteRole({ roleId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete role");
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      {isAdmin && (
        <section className="rounded-lg border border-stone-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-stone-900">Create role</h3>
          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-stone-600">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="max-w-xs rounded-md border border-stone-300 px-3 py-2"
              />
            </label>
            <fieldset>
              <legend className="text-sm text-stone-600">Permissions</legend>
              <div className="mt-2 flex gap-4">
                {PERMISSION_OPTIONS.map((perm) => (
                  <label key={perm} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={permissions.includes(perm)}
                      onChange={() => togglePermission(permissions, perm, setPermissions)}
                    />
                    {perm}
                  </label>
                ))}
              </div>
            </fieldset>
            <button
              type="submit"
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
            >
              Create role
            </button>
          </form>
        </section>
      )}

      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-stone-900">Roles</h3>
        <ul className="mt-4 divide-y divide-stone-100">
          {context.roles.map((role) => (
            <li key={String(role._id)} className="flex flex-wrap items-center justify-between gap-4 py-3">
              <div>
                <p className="font-medium text-stone-900">{role.name}</p>
                {editingId === String(role._id) ? (
                  <div className="mt-2 flex gap-4">
                    {PERMISSION_OPTIONS.map((perm) => (
                      <label key={perm} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editPermissions.includes(perm)}
                          onChange={() =>
                            togglePermission(editPermissions, perm, setEditPermissions)
                          }
                        />
                        {perm}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 font-mono text-xs text-stone-500">
                    [{role.permissions.join(", ")}]
                  </p>
                )}
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  {editingId === String(role._id) ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdate(role._id)}
                        className="rounded-md bg-stone-900 px-3 py-1 text-xs text-white"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-md border border-stone-300 px-3 py-1 text-xs"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(String(role._id));
                          setEditPermissions([...role.permissions]);
                        }}
                        className="rounded-md border border-stone-300 px-3 py-1 text-xs hover:bg-stone-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(role._id)}
                        className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}