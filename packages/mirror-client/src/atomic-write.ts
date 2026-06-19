import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export async function atomicWrite(
  filePath: string,
  content: Buffer | Uint8Array,
): Promise<void> {
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, content);
  await rename(tmp, filePath);
}