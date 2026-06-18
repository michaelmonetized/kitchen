"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { MembersTab } from "./MembersTab";
import { OrganizationTab } from "./OrganizationTab";
import { RolesTab } from "./RolesTab";

type Tab = "organization" | "members" | "roles";

export function SettingsView() {
  const orgs = useQuery(api.admin.listOrgsForUser, {});
  const [selectedOrgId, setSelectedOrgId] = useState<Id<"files"> | null>(null);
  const [tab, setTab] = useState<Tab>("organization");

  if (orgs === undefined) return <p className="text-muted">Loading settings…</p>;
  if (orgs.length === 0) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-8 text-center">
        <h2 className="text-lg font-medium text-stone-900">Access denied</h2>
        <p className="mt-2 text-sm text-stone-500">You are not a member of any organization.</p>
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

  if (context === undefined) return <p className="text-stone-500">Loading organization…</p>;
  if (context === null) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-8 text-center">
        <p className="text-stone-600">You do not have access to this organization.</p>
      </div>
    );
  }

  const panels = {
    organization: <OrganizationTab context={context} isAdmin={isAdmin} />,
    members: <MembersTab context={context} isAdmin={isAdmin} orgId={orgId} />,
    roles: <RolesTab context={context} isAdmin={isAdmin} orgId={orgId} />,
  };
  return panels[tab];
}