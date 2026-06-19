import { normalizeAbsolutePath } from "./normalize-path.js";

const DEFAULT_TTL_MS = 500;

export class EchoSuppressor {
  private readonly ttlMs: number;
  private readonly suppressed = new Map<string, number>();

  constructor(ttlMs = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  mark(absolutePath: string): void {
    const key = normalizeAbsolutePath(absolutePath);
    this.suppressed.set(key, Date.now() + this.ttlMs);
  }

  isSuppressed(absolutePath: string): boolean {
    const key = normalizeAbsolutePath(absolutePath);
    const until = this.suppressed.get(key);
    if (!until) return false;
    if (Date.now() >= until) {
      this.suppressed.delete(key);
      return false;
    }
    return true;
  }

  prune(): void {
    const now = Date.now();
    for (const [path, until] of this.suppressed) {
      if (now >= until) this.suppressed.delete(path);
    }
  }
}