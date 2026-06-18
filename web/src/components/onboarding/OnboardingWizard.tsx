"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getErrorMessage } from "@/lib/errors";
import { slugify } from "@/lib/slugify";
import { api } from "../../../convex/_generated/api";

type Step = "welcome" | "choose" | "create-team" | "join";

export function OnboardingWizard() {
  const router = useRouter();
  const orgs = useQuery(api.admin.listOrgsForUser, {});
  const ensurePersonalOrg = useMutation(api.admin.ensurePersonalOrg);
  const createOrg = useMutation(api.admin.createOrg);

  const [step, setStep] = useState<Step>("welcome");
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (orgs === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  async function handlePersonalOrg() {
    setLoading(true);
    setError(null);
    try {
      await ensurePersonalOrg({});
      router.replace("/app");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create workspace"));
      setLoading(false);
    }
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createOrg({ name: orgName, slug: orgSlug || slugify(orgName) });
      router.replace("/app");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create organization"));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">Welcome</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Set up your Kitchen
        </h1>
        <p className="mt-3 text-muted">
          Create a workspace or join an existing team to start syncing projects.
        </p>
      </div>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {step === "welcome" && (
        <div className="mt-10 space-y-4">
          <button
            type="button"
            onClick={() => setStep("choose")}
            className="w-full rounded-xl bg-foreground px-6 py-3 text-sm font-medium text-surface transition-colors hover:bg-muted-foreground"
          >
            Continue
          </button>
        </div>
      )}

      {step === "choose" && (
        <div className="mt-10 space-y-4">
          <button
            type="button"
            disabled={loading}
            onClick={() => void handlePersonalOrg()}
            className="w-full rounded-xl border border-border bg-surface p-6 text-left transition-colors hover:border-accent hover:bg-accent-muted disabled:opacity-50"
          >
            <p className="font-semibold text-foreground">Personal workspace</p>
            <p className="mt-1 text-sm text-muted">
              Quick start with a personal org and sample project. Best for solo exploration.
            </p>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => setStep("create-team")}
            className="w-full rounded-xl border border-border bg-surface p-6 text-left transition-colors hover:border-accent hover:bg-accent-muted disabled:opacity-50"
          >
            <p className="font-semibold text-foreground">Create a team org</p>
            <p className="mt-1 text-sm text-muted">
              Set up an organization for your team with roles and project ACLs.
            </p>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => setStep("join")}
            className="w-full rounded-xl border border-border bg-surface p-6 text-left transition-colors hover:border-accent hover:bg-accent-muted disabled:opacity-50"
          >
            <p className="font-semibold text-foreground">Join an existing org</p>
            <p className="mt-1 text-sm text-muted">
              Wait for an admin to invite you by email, then sign in again.
            </p>
          </button>
        </div>
      )}

      {step === "create-team" && (
        <form onSubmit={handleCreateTeam} className="mt-10 space-y-6">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Organization name</span>
            <input
              value={orgName}
              onChange={(e) => {
                setOrgName(e.target.value);
                if (!orgSlug) setOrgSlug(slugify(e.target.value));
              }}
              required
              placeholder="Acme Corp"
              className="mt-2 w-full rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-foreground"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Slug</span>
            <input
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
              placeholder="acme-corp"
              className="mt-2 w-full rounded-lg border border-border-strong bg-surface px-4 py-2.5 font-mono text-foreground"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("choose")}
              className="rounded-lg border border-border-strong px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-muted"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-surface hover:bg-muted-foreground disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create organization"}
            </button>
          </div>
        </form>
      )}

      {step === "join" && (
        <div className="mt-10 rounded-xl border border-border bg-surface-muted p-6">
          <h2 className="font-semibold text-foreground">Waiting for an invite</h2>
          <p className="mt-3 text-sm text-muted leading-relaxed">
            Ask your org admin to invite you from Settings → Members. They will need your email
            address. Once assigned a role, refresh this page or sign in again — your projects
            will appear automatically.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            In the meantime, you can create a personal workspace instead.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setStep("choose")}
              className="rounded-lg border border-border-strong px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void handlePersonalOrg()}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              Create personal workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}