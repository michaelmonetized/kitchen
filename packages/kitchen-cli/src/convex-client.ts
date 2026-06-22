import { ConvexHttpClient } from "convex/browser";
import { api } from "@kitchen/mirror-client/convex-api";
import type { MirrorAuth } from "@kitchen/mirror-client/auth";
import { refreshConvexJwt } from "@kitchen/mirror-client/auth";

export async function createClient(
  convexUrl: string,
  auth?: MirrorAuth | null,
): Promise<ConvexHttpClient> {
  const client = new ConvexHttpClient(convexUrl);
  if (auth) {
    client.setAuth(await refreshConvexJwt(auth));
  }
  return client;
}

export { api };