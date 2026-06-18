export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    service: "kitchen-web",
    ts: Date.now(),
  });
}