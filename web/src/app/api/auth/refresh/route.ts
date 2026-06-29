import { jsonResponse, optionsResponse } from "@/lib/api/cors";
import {
  buildSessionCookie,
  clearSessionCookieHeader,
  getPublicIpFromRequest,
  getSessionTokenFromCookieHeader,
  isRecoveryTokenFormat,
  sessionCookieHeader,
  touchSessionFromToken,
} from "@/lib/auth/session";

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    const token = getSessionTokenFromCookieHeader(request.headers.get("cookie"));
    if (!token) {
      return jsonResponse(
        { ok: false, error: "No hay sesion activa." },
        { status: 401, headers: { "Set-Cookie": clearSessionCookieHeader() } },
      );
    }
    if (!isRecoveryTokenFormat(token)) {
      return jsonResponse(
        { ok: false, error: "Token invalido." },
        { status: 401, headers: { "Set-Cookie": clearSessionCookieHeader() } },
      );
    }

    const session = await touchSessionFromToken(token, getPublicIpFromRequest(request));
    if (!session) {
      return jsonResponse(
        { ok: false, error: "Token invalido." },
        { status: 401, headers: { "Set-Cookie": clearSessionCookieHeader() } },
      );
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
