/**
 * Kitchen collab relay — standalone Node WebSocket service.
 *
 * Deployment:
 * - Local dev: `npm run relay -w web` (default ws://127.0.0.1:9473)
 * - Production: run on any Node host with a public WS URL (Railway, Fly, ECS).
 *   Set NEXT_PUBLIC_COLLAB_RELAY_URL to the public ws(s) endpoint.
 * - Vercel: Next.js cannot host long-lived WebSockets; deploy this process
 *   separately and point COLLAB_RELAY_URL at it.
 *
 * Required env:
 * - COLLAB_RELAY_SECRET — shared with Convex (npx convex env set)
 * - NEXT_PUBLIC_CONVEX_SITE_URL — Convex HTTP actions base URL
 */
import { CollabRelay } from "@kitchen/collab-relay";

const host = process.env.COLLAB_RELAY_HOST ?? "127.0.0.1";
const port = Number(process.env.COLLAB_RELAY_PORT ?? "9473");
const secret = process.env.COLLAB_RELAY_SECRET ?? "dev-collab-relay-secret";
const convexSite =
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL ??
  process.env.CONVEX_SITE_URL ??
  "";

async function checkpointToConvex(
  fileId: string,
  clerkUserId: string,
  content: string
): Promise<string | null> {
  if (!convexSite) {
    console.warn("collab-relay: CONVEX_SITE_URL unset — using local version ids");
    return null;
  }

  const contentBase64 = Buffer.from(content, "utf8").toString("base64");
  const res = await fetch(`${convexSite}/relay/checkpoint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret,
      fileId,
      clerkUserId,
      contentBase64,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("collab-relay: checkpoint failed", res.status, err);
    return null;
  }

  const data = (await res.json()) as { versionId?: string };
  return data.versionId ?? null;
}

const relay = new CollabRelay({
  host,
  port,
  onCheckpoint: async ({ filePath, content, userId }) =>
    checkpointToConvex(filePath, userId, content),
});

await relay.start();
console.log(`collab-relay listening on ${relay.url}`);

const shutdown = async () => {
  await relay.stop();
  process.exit(0);
};

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());