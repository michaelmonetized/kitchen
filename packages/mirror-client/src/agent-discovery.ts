import { access, copyFile, mkdir, writeFile } from "node:fs/promises";
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
    const payload = JSON.stringify({ deploymentUrl: convexUrl }, null, 2) + "\n";
    await writeFile(convexJsonPath, payload, "utf8");
    console.log(`cloud→disk materialize ${convexJsonPath}`);
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