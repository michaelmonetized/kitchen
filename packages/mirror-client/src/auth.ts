import { createClerkClient } from "@clerk/backend";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import {
  AUTH_FILE,
  KITCHEN_DIR,
  LEGACY_AUTH_FILE,
  resolveClerkPublishableKey,
} from "./config.js";

const execAsync = promisify(exec);

export type MirrorAuth = {
  sessionId: string;
  userId: string;
  email?: string;
  savedAt: number;
};

export async function loadAuth(): Promise<MirrorAuth | null> {
  for (const file of [AUTH_FILE, LEGACY_AUTH_FILE]) {
    try {
      const raw = await readFile(file, "utf8");
      const auth = JSON.parse(raw) as MirrorAuth;
      if (file === LEGACY_AUTH_FILE) {
        await saveAuth(auth);
      }
      return auth;
    } catch {
      continue;
    }
  }
  return null;
}

export async function saveAuth(auth: MirrorAuth): Promise<void> {
  await mkdir(KITCHEN_DIR, { recursive: true });
  await writeFile(AUTH_FILE, JSON.stringify(auth, null, 2) + "\n", "utf8");
}

export async function getConvexJwt(sessionId: string): Promise<string> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "CLERK_SECRET_KEY required to mint Convex JWT (run scripts/setup-env.sh)",
    );
  }

  const clerk = createClerkClient({ secretKey });
  const token = await clerk.sessions.getToken(sessionId, "convex");
  if (!token?.jwt) {
    throw new Error("Failed to obtain Convex JWT — run `npm run login -w @kitchen/mirror-client`");
  }
  return token.jwt;
}

export async function refreshConvexJwt(auth: MirrorAuth): Promise<string> {
  return getConvexJwt(auth.sessionId);
}

async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;
  const cmd =
    platform === "darwin"
      ? `open "${url}"`
      : platform === "win32"
        ? `start "" "${url}"`
        : `xdg-open "${url}"`;
  try {
    await execAsync(cmd);
  } catch {
    console.log(`Open in browser: ${url}`);
  }
}

function loginHtml(publishableKey: string, port: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Kitchen — Sign in</title>
  <script async crossorigin src="https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 420px; margin: 4rem auto; padding: 0 1rem; }
    h1 { font-size: 1.25rem; }
    #status { color: #57534e; margin-top: 1rem; }
  </style>
</head>
<body>
  <h1>Kitchen — Sign in</h1>
  <div id="sign-in"></div>
  <p id="status">Loading Clerk…</p>
  <script>
    const publishableKey = ${JSON.stringify(publishableKey)};
    const port = ${port};

    async function main() {
      const status = document.getElementById("status");
      await window.Clerk.load({ publishableKey });
      const session = window.Clerk.session;
      if (session) {
        status.textContent = "Signed in — saving session…";
        await finish(session.id, session.user.id, session.user.primaryEmailAddress?.emailAddress);
        return;
      }
      status.textContent = "Sign in to Kitchen (CLI + mirror).";
      window.Clerk.mountSignIn(document.getElementById("sign-in"));
      window.Clerk.addListener(({ session }) => {
        if (session) {
          status.textContent = "Signed in — saving session…";
          finish(session.id, session.user.id, session.user.primaryEmailAddress?.emailAddress);
        }
      });
    }

    async function finish(sessionId, userId, email) {
      const res = await fetch("/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userId, email }),
      });
      if (res.ok) {
        document.body.innerHTML = "<h1>Success</h1><p>Session saved. You can close this tab and return to the terminal.</p>";
      } else {
        document.getElementById("status").textContent = "Failed to save session.";
      }
    }

    window.addEventListener("load", () => main().catch((e) => {
      document.getElementById("status").textContent = String(e);
    }));
  </script>
</body>
</html>`;
}

export async function runLoginFlow(): Promise<MirrorAuth> {
  const publishableKey = resolveClerkPublishableKey();
  if (!publishableKey) {
    throw new Error(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY required (run scripts/setup-env.sh)",
    );
  }

  const auth = await new Promise<MirrorAuth>((resolve, reject) => {
    let boundPort = 0;

    const server = createServer(async (req, res) => {
      try {
        if (req.url === "/" && req.method === "GET") {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(loginHtml(publishableKey, boundPort));
          return;
        }

        if (req.url === "/callback" && req.method === "POST") {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
            sessionId: string;
            userId: string;
            email?: string;
          };

          if (!body.sessionId || !body.userId) {
            res.writeHead(400);
            res.end("missing session");
            return;
          }

          const saved: MirrorAuth = {
            sessionId: body.sessionId,
            userId: body.userId,
            email: body.email,
            savedAt: Date.now(),
          };
          await saveAuth(saved);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true }));
          server.close();
          resolve(saved);
          return;
        }

        res.writeHead(404);
        res.end("not found");
      } catch (err) {
        reject(err);
      }
    });

    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("failed to bind login server"));
        return;
      }
      boundPort = addr.port;
      const url = `http://127.0.0.1:${boundPort}/`;
      console.log(`Login server listening on ${url}`);
      void openBrowser(url);
    });
  });

  await getConvexJwt(auth.sessionId);
  console.log(`Session saved for ${auth.email ?? auth.userId}`);
  console.log(`Credentials: ${AUTH_FILE}`);
  return auth;
}