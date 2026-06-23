import { jsonResponse, optionsResponse } from "@/lib/api/cors";
import {
  buildSessionCookie,
  canUseFilesystemSessionFallback,
  getFilesystemSessionFromToken,
  getPublicIpFromRequest,
  getSessionFromToken,
  hashRecoveryToken,
  isRecoveryTokenFormat,
  sessionCookieHeader,
} from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string };
    const token = body.token?.trim();
    if (!token || !isRecoveryTokenFormat(token)) {
      return jsonResponse({ ok: false, error: "Token invalido." }, { status: 401 });
    }

    const session = await getSessionFromToken(token);
    if (!session) {
      return jsonResponse({ ok: false, error: "Token invalido." }, { status: 401 });
    }

    const publicIp = getPublicIpFromRequest(request);
    try {
      await getDb().user.update({
        where: { tokenHash: hashRecoveryToken(token) },
        data: { lastLoginAt: new Date(), lastLoginIp: publicIp },
      });
    } catch (error) {
      if (!canUseFilesystemSessionFallback()) throw error;
      const filesystemSession = await getFilesystemSessionFromToken(token);
      if (!filesystemSession) throw error;
    }

    return jsonResponse(
      { ok: true, user: { id: session.userId, name: session.userName } },
      { headers: { "Set-Cookie": sessionCookieHeader(buildSessionCookie(token)) } },
    );
  } catch (error) {
    return jsonResponse(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
