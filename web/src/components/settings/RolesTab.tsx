"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { getErrorMessage } from "@/lib/errors";
import { api } from "../../../convex/_generated/api";
import { FormAlert } from "@/components/ui/FormAlert";
import type { OrgContext } from "./types";

const PERMISSION_OPTIONS = ["read", "write", "admin"] as const;

export function RolesTab({
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
      setError(getErrorMessage(err, "Failed to create role"));
    }
  }

  async function handleUpdate(roleId: Id<"roles">) {
    setError(null);
    try {
      await updateRole({ roleId, permissions: editPermissions });
      setEditingId(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update role"));
    }
  }

  async function handleDelete(roleId: Id<"roles">) {
    setError(null);
    try {
      await deleteRole({ roleId });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete role"));
    }
  }

  return (
    <div className="space-y-6">
      <FormAlert error={error} />

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