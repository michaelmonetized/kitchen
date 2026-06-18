import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

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

export default http;