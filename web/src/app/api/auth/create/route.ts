import { jsonResponse, optionsResponse } from "@/lib/api/cors";
import { isValidPlayerPortraitId } from "@/lib/data/player-portraits";
import { createInitialState } from "@/lib/domain/initial-state";
import { persistGameStateForUser } from "@/lib/actions/_demo";
import { saveState } from "@/lib/demo-store";
import {
  buildSessionCookie,
  canUseFilesystemSessionFallback,
  createFilesystemSession,
  generateRecoveryToken,
  getPublicIpFromRequest,
  hashRecoveryToken,
  sessionCookieHeader,
} from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; portraitAssetId?: string };
    const name = body.name?.trim().replace(/\s+/g, " ");
    if (!name || name.length < 2 || name.length > 40) {
      return jsonResponse(
        { ok: false, error: "Nombre de personaje invalido." },
        { status: 400 },
      );
    }

    const rawPortrait = body.portraitAssetId?.trim();
    if (rawPortrait !== undefined && !isValidPlayerPortraitId(rawPortrait)) {
      return jsonResponse(
        { ok: false, error: "Retrato de personaje invalido." },
        { status: 400 },
      );
    }
    const portraitAssetId = rawPortrait && isValidPlayerPortraitId(rawPortrait) ? rawPortrait : undefined;

    const token = generateRecoveryToken();
    const tokenHash = hashRecoveryToken(token);
    const state = createInitialState(name, portraitAssetId);
    const publicIp = getPublicIpFromRequest(request);
    try {
      const db = getDb();
      const user = await db.user.create({
        data: {
          email: null,
          name,
          tokenHash,
          tokenIssuedAt: new Date(),
          lastLoginAt: new Date(),
          lastLoginIp: publicIp,
          portraitAssetId: portraitAssetId ?? null,
        },
        select: { id: true },
      });
      await persistGameStateForUser(user.id, state);
    } catch (error) {
      if (!canUseFilesystemSessionFallback()) throw error;
      await createFilesystemSession(name, token, publicIp);
      await saveState(state);
    }

    return jsonResponse(
      { ok: true, token, state },
      { headers: { "Set-Cookie": sessionCookieHeader(buildSessionCookie(token)) } },
    );
  } catch (error) {
    return jsonResponse(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
