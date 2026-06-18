"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { getErrorMessage } from "@/lib/errors";
import { slugify } from "@/lib/slugify";
import { api } from "../../../convex/_generated/api";
import { FormAlert } from "@/components/ui/FormAlert";
import type { OrgContext } from "./types";

export function OrganizationTab({
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
      setError(getErrorMessage(err, "Failed to create org"));
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
      setError(getErrorMessage(err, "Failed to create project"));
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
      setError(getErrorMessage(err, "Transfer failed"));
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
      setError(getErrorMessage(err, "Failed to update properties"));
    }
  }

  return (
    <div className="space-y-8">
      <FormAlert status={status} error={error} />

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