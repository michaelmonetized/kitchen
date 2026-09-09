import Link from "next/link";
import type { Metadata } from "next";
import { ThreeModesDiagram } from "@/components/marketing/ThreeModesDiagram";

export const metadata: Metadata = {
  title: "Mission — Kitchen",
  description:
    "Understand Kitchen’s model for storage, sync, work, and collaboration — without importing git or cloud-IDE assumptions.",
};

const SUCCESS = [
  "Explain storage (rows + versions), sync (live), work (mirror + any editor), and collaboration (three modes) in plain language",
  "Trace a solo save: editor → mirror → versions.insert → peer mirror",
  "Trace a pair session: Collab agent → relay → checkpoint → version",
  "Distinguish live sync from live collab without hesitation",
  "Use the product’s words: User, Org, Project, Owner, Manager, Version, Mirror",
] as const;

const RULES = [
  "Learn the model before the schema. Vision first, then the running app.",
  "Voice and chat stay outside Kitchen. Kitchen syncs file bytes.",
  "Web is review. Editing happens on disk through the Mirror.",
] as const;

export default function MissionPage() {
  return (
    <main className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">Mission</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
          Make the model obvious.
        </h1>
        <p className="mt-4 text-lg text-muted leading-relaxed">
          Understand Kitchen’s model for project storage, sync, solo work, and collaboration —
          well enough to use it, without importing git or cloud-IDE assumptions.
        </p>
        <p className="mt-4 text-muted leading-relaxed">
          If you still think in clone, commit, and pull request, we have not done the job. If you
          save in your editor and expect history to already exist, we have.
        </p>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-foreground">You can do this when you can</h2>
          <ul className="mt-6 space-y-3">
            {SUCCESS.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-border bg-surface p-4 text-sm text-muted"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12" id="three-modes">
          <h2 className="text-xl font-semibold text-foreground">Three modes of work</h2>
          <p className="mt-3 text-sm text-muted">
            Solo sync is the default. Fork + merge when two people save without pairing. Live pair
            is later.
          </p>
          <div className="mt-6">
            <ThreeModesDiagram />
          </div>
        </section>

        <section className="mt-12 rounded-xl border border-border bg-surface-muted p-6">
          <h2 className="text-lg font-semibold text-foreground">How we teach it</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {RULES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-xl border border-border bg-surface p-6 text-center">
          <p className="font-medium text-foreground">Start with the vision, then the product.</p>
          <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/vision"
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted"
            >
              Read the vision
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-surface hover:bg-muted-foreground"
            >
              Open the beta
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
