import Link from "next/link";
import type { Metadata } from "next";
import { FourLayersDiagram } from "@/components/marketing/FourLayersDiagram";

export const metadata: Metadata = {
  title: "Vision — Kitchen",
  description:
    "What if your codebase lived in a cloud Sync Store and mirrored to disk like Drive mirrors documents?",
};

const LAYERS = [
  {
    name: "Storage",
    idea: "Files are rows. Versions are append-only history — not server paths or git objects.",
  },
  {
    name: "Sync",
    idea: "Live WebSocket push — not commit / push / pull.",
  },
  {
    name: "Work",
    idea: "Mirror at $HOME/Projects. Personal project at the top level; org project under the org folder. Any editor, any terminal.",
  },
  {
    name: "Collaboration",
    idea: "Solo sync, async fork + Pierre merge, live pair later via Collab agent.",
  },
] as const;

const SUCCESS = [
  {
    title: "Storage and sync",
    items: [
      "Open $HOME/Projects/my-app/src/index.ts, save, and every other logged-in machine sees it in seconds.",
      "Binaries sit in the same file/version model. No separate blob service.",
      "A new teammate logs in, gets a role, and projects appear on disk — no clone, no fetch, no checkout.",
    ],
  },
  {
    title: "Work",
    items: [
      "Zed on the laptop, VS Code on the desktop — same project, same mirror, zero git in the loop.",
      "Org owner creates roles, assigns members, and keeps ownership when someone is fired.",
    ],
  },
  {
    title: "Collaboration",
    items: [
      "Two people edit without pairing. Both versions exist. Pierre Merge is a line-pick, not a guess.",
      "Live pair (later): Neovim and VS Code, no browser, no Kitchen plugins. Voice stays on Discord. Checkpoint inserts one version.",
    ],
  },
] as const;

export default function VisionPage() {
  return (
    <main className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">Vision</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
          Cloud holds truth. Disk is a mirror.
        </h1>
        <p className="mt-4 text-lg text-muted leading-relaxed">
          Traditional version control optimizes for async work: branches, commits, pull requests.
          That model fights realtime work, and it treats the filesystem as truth until you push.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-foreground">
          What if your codebase lived in a cloud Sync Store and mirrored to your machine the way
          Drive mirrors documents?
        </p>
        <p className="mt-4 text-muted leading-relaxed">
          Not another IDE. Not another git host. Storage, sync, work, and collaboration — one
          model. Files feel local and stay globally live.
        </p>

        <section className="mt-12" id="four-layers">
          <h2 className="text-xl font-semibold text-foreground">Four layers</h2>
          <div className="mt-6">
            <FourLayersDiagram />
          </div>
          <ul className="mt-8 space-y-4">
            {LAYERS.map((layer) => (
              <li key={layer.name} className="rounded-xl border border-border bg-surface p-5">
                <p className="text-sm font-semibold uppercase tracking-wider text-accent">
                  {layer.name}
                </p>
                <p className="mt-2 text-sm text-muted">{layer.idea}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-foreground">Success looks like</h2>
          <div className="mt-6 space-y-8">
            {SUCCESS.map((block) => (
              <div key={block.title}>
                <h3 className="text-base font-semibold text-foreground">{block.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-xl border border-border bg-surface-muted p-6 text-center">
          <p className="font-medium text-foreground">The model in practice</p>
          <p className="mt-2 text-sm text-muted">
            Mission is how we know someone actually understands it.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/mission"
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
            >
              Read the mission
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
