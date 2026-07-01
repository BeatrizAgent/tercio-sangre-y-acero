import { listArenaOpponentsFromDb } from "@/lib/server/arena-bots";
import { jsonResponse, optionsResponse } from "@/lib/api/cors";
import { requireApiSession, UnauthorizedError } from "@/lib/auth/session";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  try {
    await requireApiSession();
    return jsonResponse({ ok: true, opponents: await listArenaOpponentsFromDb() });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonResponse({ ok: false, error: error.message }, { status: 401 });
    }
    return jsonResponse(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
