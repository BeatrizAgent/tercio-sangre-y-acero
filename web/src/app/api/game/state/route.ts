import { persistGameState } from "@/lib/actions/_demo";
import { jsonResponse, optionsResponse } from "@/lib/api/cors";
import { UnauthorizedError } from "@/lib/auth/session";
import { loadGameViewState } from "@/lib/server/game-view";
import type { GameState } from "@/lib/types";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  try {
    return jsonResponse({ ok: true, state: await loadGameViewState() });
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

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { state?: GameState };
    if (!body.state?.soldier) {
      return jsonResponse({ ok: false, error: "Missing state" }, { status: 400 });
    }
    await persistGameState(body.state);
    return jsonResponse({ ok: true });
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
