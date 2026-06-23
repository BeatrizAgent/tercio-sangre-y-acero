import { jsonResponse, optionsResponse } from "@/lib/api/cors";
import { listPublicPlayerProfilesFromDb } from "@/lib/server/player-profiles";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  try {
    return jsonResponse({ ok: true, players: await listPublicPlayerProfilesFromDb() });
  } catch (error) {
    return jsonResponse(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
