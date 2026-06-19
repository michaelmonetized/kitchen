const DEFAULT_TTL_MS = 500;

export class EchoSuppressor {
  private readonly ttlMs: number;
  private readonly suppressed = new Map<string, number>();

  constructor(ttlMs = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  mark(path: string): void {
    this.suppressed.set(path, Date.now() + this.ttlMs);
  }

  isSuppressed(path: string): boolean {
    const until = this.suppressed.get(path);
    if (!until) return false;
    if (Date.now() >= until) {
      this.suppressed.delete(path);
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