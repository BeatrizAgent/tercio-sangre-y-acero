import { jsonResponse, optionsResponse } from "@/lib/api/cors";
import {
  buildSessionCookie,
  getPublicIpFromRequest,
  isRecoveryTokenFormat,
  sessionCookieHeader,
  touchSessionFromToken,
} from "@/lib/auth/session";

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

    const session = await touchSessionFromToken(token, getPublicIpFromRequest(request));
    if (!session) {
      return jsonResponse({ ok: false, error: "Token invalido." }, { status: 401 });
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
