import { listArenaOpponentsFromDb } from "@/lib/server/arena-bots";
import { jsonResponse, optionsResponse } from "@/lib/api/cors";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  try {
    return jsonResponse({ ok: true, opponents: await listArenaOpponentsFromDb() });
  } catch (error) {
    return jsonResponse(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
