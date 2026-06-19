import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { QUEUE_DIR } from "./config.js";
import type { Id } from "./types.js";

export type QueueEntry = {
  id: string;
  seq: number;
  absolutePath: string;
  fileId: Id<"files">;
  hash: string;
  contentBase64: string;
  parentVersionId?: Id<"versions">;
  projectId: Id<"files">;
  fileName: string;
  queuedAt: number;
};

type QueueMeta = {
  nextSeq: number;
};

const META_FILE = "meta.json";

function entryFileName(seq: number, id: string): string {
  return `${String(seq).padStart(10, "0")}-${id}.json`;
}

export class InsertQueue {
  private readonly dir: string;
  private meta!: QueueMeta;

  private constructor(dir: string) {
    this.dir = dir;
  }

  static async open(dir: string = QUEUE_DIR): Promise<InsertQueue> {
    await mkdir(dir, { recursive: true });
    const queue = new InsertQueue(dir);
    queue.meta = await queue.loadMeta();
    return queue;
  }

  private metaPath(): string {
    return path.join(this.dir, META_FILE);
  }

  private async loadMeta(): Promise<QueueMeta> {
    try {
      const raw = await readFile(this.metaPath(), "utf8");
      const parsed = JSON.parse(raw) as QueueMeta;
      if (typeof parsed.nextSeq === "number" && parsed.nextSeq > 0) {
        return parsed;
      }
    } catch {
      // fresh queue
    }
    const nextSeq = await this.inferNextSeq();
    const meta = { nextSeq };
    await this.saveMeta(meta);
    return meta;
  }

  private async inferNextSeq(): Promise<number> {
    const files = await this.listEntryFiles();
    let max = 0;
    for (const file of files) {
      const seq = Number.parseInt(file.slice(0, 10), 10);
      if (!Number.isNaN(seq) && seq > max) max = seq;
    }
    return max + 1;
  }

  private async saveMeta(meta: QueueMeta): Promise<void> {
    await writeFile(this.metaPath(), JSON.stringify(meta, null, 2) + "\n", "utf8");
  }

  private async listEntryFiles(): Promise<string[]> {
    const names = await readdir(this.dir);
    return names.filter((n) => /^\d{10}-.+\.json$/.test(n)).sort();
  }

  async list(): Promise<QueueEntry[]> {
    const files = await this.listEntryFiles();
    const entries: QueueEntry[] = [];
    for (const file of files) {
      const raw = await readFile(path.join(this.dir, file), "utf8");
      entries.push(JSON.parse(raw) as QueueEntry);
    }
    return entries;
  }

  async count(): Promise<number> {
    return (await this.listEntryFiles()).length;
  }

  async enqueue(
    partial: Omit<QueueEntry, "id" | "seq" | "queuedAt"> & { queuedAt?: number },
  ): Promise<QueueEntry> {
    const entry: QueueEntry = {
      id: randomUUID(),
      seq: this.meta.nextSeq,
      queuedAt: partial.queuedAt ?? Date.now(),
      absolutePath: partial.absolutePath,
      fileId: partial.fileId,
      hash: partial.hash,
      contentBase64: partial.contentBase64,
      parentVersionId: partial.parentVersionId,
      projectId: partial.projectId,
      fileName: partial.fileName,
    };
    this.meta.nextSeq += 1;
    await this.saveMeta(this.meta);
    await writeFile(
      path.join(this.dir, entryFileName(entry.seq, entry.id)),
      JSON.stringify(entry, null, 2) + "\n",
      "utf8",
    );
    return entry;
  }

  async remove(entry: QueueEntry): Promise<void> {
    const file = entryFileName(entry.seq, entry.id);
    try {
      await unlink(path.join(this.dir, file));
    } catch {
      // already removed
    }
  }
}