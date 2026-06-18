"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { getErrorMessage } from "@/lib/errors";
import { api } from "../../../convex/_generated/api";
import { FormAlert } from "@/components/ui/FormAlert";
import type { OrgContext } from "./types";

export function MembersTab({
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
      setError(getErrorMessage(err, "Invite failed"));
    }
  }

  async function handleRemove(assignmentId: Id<"user_roles">) {
    setError(null);
    try {
      await removeMember({ assignmentId });
    } catch (err) {
      setError(getErrorMessage(err, "Remove failed"));
    }
  }

  return (
    <div className="space-y-6">
      <FormAlert status={status} error={error} />

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