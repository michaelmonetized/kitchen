import { mkdir, writeFile } from "node:fs/promises";
import { KITCHEN_DIR, STATUS_FILE } from "./config.js";

export type TrayState = "synced" | "offline" | "syncing";

export type TrayStatusSnapshot = {
  state: TrayState;
  label: string;
  queued: number;
  updatedAt: number;
};

export class TrayStatus {
  private state: TrayState = "synced";
  private queued = 0;

  private label(): string {
    switch (this.state) {
      case "synced":
        return "Synced";
      case "offline":
        return this.queued > 0 ? `Offline (${this.queued} queued)` : "Offline";
      case "syncing":
        return "Syncing…";
    }
  }

  snapshot(): TrayStatusSnapshot {
    return {
      state: this.state,
      label: this.label(),
      queued: this.queued,
      updatedAt: Date.now(),
    };
  }

  async setSynced(): Promise<void> {
    await this.publish("synced", 0);
  }

  async setOffline(queued: number): Promise<void> {
    await this.publish("offline", queued);
  }

  async setSyncing(queued: number): Promise<void> {
    await this.publish("syncing", queued);
  }

  private async publish(state: TrayState, queued: number): Promise<void> {
    if (this.state === state && this.queued === queued) return;
    this.state = state;
    this.queued = queued;
    const snapshot = this.snapshot();
    await mkdir(KITCHEN_DIR, { recursive: true });
    await writeFile(STATUS_FILE, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
    console.log(`[Kitchen] ${snapshot.label}`);
    if (process.platform !== "win32") {
      try {
        process.title = `Kitchen — ${snapshot.label}`;
      } catch {
        // ignore
      }
    }
  }
}