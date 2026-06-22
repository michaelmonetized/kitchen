import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AGENTS_TEMPLATE = path.join(
  packageRoot(),
  "templates",
  ".kitchen",
  "docs",
  "AGENTS.md",
);

export async function ensureAgentDiscoveryKit(
  projectDir: string,
  convexUrl: string,
  projectId?: string,
): Promise<void> {
  const kitchenDir = path.join(projectDir, ".kitchen");
  const docsDir = path.join(kitchenDir, "docs");
  await mkdir(docsDir, { recursive: true });

  const agentsPath = path.join(docsDir, "AGENTS.md");
  if (!(await pathExists(agentsPath))) {
    await copyFile(AGENTS_TEMPLATE, agentsPath);
    console.log(`cloud→disk materialize ${agentsPath}`);
  }

  const convexJsonPath = path.join(kitchenDir, "convex.json");
  if (!(await pathExists(convexJsonPath))) {
    const payload: Record<string, string> = { deploymentUrl: convexUrl };
    if (projectId) payload.projectId = projectId;
    await writeFile(convexJsonPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
    console.log(`cloud→disk materialize ${convexJsonPath}`);
  } else if (projectId) {
    try {
      const raw = await readFile(convexJsonPath, "utf8");
      const existing = JSON.parse(raw) as Record<string, string>;
      if (!existing.projectId) {
        existing.projectId = projectId;
        await writeFile(convexJsonPath, JSON.stringify(existing, null, 2) + "\n", "utf8");
      }
    } catch {
      // preserve user-edited convex.json on parse errors
    }
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function packageRoot(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
}