"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import type { Doc } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

type ProjectRow = { org: Doc<"files">; project: Doc<"files"> };

export function ProjectList() {
  const projects = useQuery(api.queries.projectsForUser, {});

  if (projects === undefined) {
    return <p className="text-stone-500">Loading projects…</p>;
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center">
        <p className="text-stone-600">No projects yet.</p>
        <p className="mt-2 text-sm text-stone-500">
          Create your first org and project in Settings.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {(projects as ProjectRow[]).map(({ org, project }) => (
        <li key={String(project._id)}>
          <Link
            href={`/app/projects/${String(project._id)}`}
            className="block rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-400"
          >
            <p className="font-medium text-stone-900">{String(project.name)}</p>
            <p className="text-sm text-stone-500">{String(org.name)}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}