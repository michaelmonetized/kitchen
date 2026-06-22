import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/app(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  const segments = pathname.split("/").filter(Boolean);

  if (
    segments.length >= 2 &&
    !["app", "sign-in", "sign-up", "api", "docs", "pricing", "discover"].includes(
      segments[0]!,
    )
  ) {
    const username = segments[0]!.toLowerCase();
    try {
      const url = new URL("/api/username-redirect", req.nextUrl.origin);
      url.searchParams.set("from", username);
      const res = await fetch(url.toString());
      if (res.ok) {
        const body = (await res.json()) as { redirect: string | null };
        if (body.redirect && body.redirect !== username) {
          const rest = segments.slice(1).join("/");
          const target = new URL(`/${body.redirect}/${rest}`, req.nextUrl.origin);
          return NextResponse.redirect(target, 301);
        }
      }
    } catch {
      // continue without redirect
    }
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};