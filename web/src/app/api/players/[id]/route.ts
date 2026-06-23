import { jsonResponse, optionsResponse } from "@/lib/api/cors";
import { getPublicPlayerProfileFromDb } from "@/lib/server/player-profiles";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const profile = await getPublicPlayerProfileFromDb(id);
    if (!profile) return jsonResponse({ ok: false, error: "Perfil no encontrado." }, { status: 404 });
    return jsonResponse({ ok: true, profile });
  } catch (error) {
    return jsonResponse(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
