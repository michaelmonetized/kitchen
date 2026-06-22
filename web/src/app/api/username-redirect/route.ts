import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("from");
  if (!username) {
    return Response.json({ redirect: null }, { status: 400 });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return Response.json({ redirect: null }, { status: 500 });
  }

  const client = new ConvexHttpClient(convexUrl);
  const redirect = await client.query(api.accounts.resolveUsernameRedirect, {
    username,
  });

  return Response.json({ redirect });
}