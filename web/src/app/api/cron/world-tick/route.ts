import { jsonResponse, optionsResponse } from "@/lib/api/cors";
import { settleWorld } from "@/lib/server/world";

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided =
    request.headers.get("x-cron-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || provided !== secret) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await settleWorld(new Date());
  return jsonResponse({ ok: true, result });
}
