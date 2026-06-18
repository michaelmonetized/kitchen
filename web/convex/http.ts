import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json();
    const type = payload?.type as string | undefined;
    const data = payload?.data;

    if (type === "user.created" || type === "user.updated") {
      const clerkId = data?.id as string | undefined;
      const email =
        (data?.email_addresses?.[0]?.email_address as string | undefined) ??
        (data?.primary_email_address_id as string | undefined);
      const displayName = [data?.first_name, data?.last_name]
        .filter(Boolean)
        .join(" ");

      if (clerkId && email) {
        await ctx.runMutation(internal.users.upsertFromClerk, {
          clerkId,
          email,
          displayName: displayName || undefined,
        });
      }
    }

    return new Response(null, { status: 200 });
  }),
});

http.route({
  path: "/relay/checkpoint",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = (await request.json()) as {
      secret?: string;
      fileId?: string;
      clerkUserId?: string;
      contentBase64?: string;
    };

    if (
      !body.secret ||
      !body.fileId ||
      !body.clerkUserId ||
      !body.contentBase64
    ) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const bytes = Uint8Array.from(atob(body.contentBase64), (c) =>
      c.charCodeAt(0)
    );

    try {
      const versionId = await ctx.runMutation(
        internal.collabRelay.insertCheckpoint,
        {
          secret: body.secret,
          fileId: body.fileId as Id<"files">,
          clerkUserId: body.clerkUserId,
          content: bytes.buffer as ArrayBuffer,
        }
      );

      return new Response(JSON.stringify({ versionId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "checkpoint failed";
      return new Response(JSON.stringify({ error: message }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;