import { jsonResponse, optionsResponse } from "@/lib/api/cors";
import {
  buildSessionCookie,
  canUseFilesystemSessionFallback,
  generateRecoveryToken,
  getPublicIpFromRequest,
  hashRecoveryToken,
  recoverFilesystemSessionByIp,
  sessionCookieHeader,
} from "@/lib/auth/session";
import { getDb } from "@/lib/db";

type RecoveryUser = { id: string; name: string };

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  const publicIp = getPublicIpFromRequest(request);
  return jsonResponse({ ok: Boolean(publicIp), publicIp });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { name?: string; publicIpHint?: string };
    const name = body.name?.trim().replace(/\s+/g, " ");
    const publicIp = getPublicIpFromRequest(request) ?? (canUseFilesystemSessionFallback() ? body.publicIpHint : null);
    if (!publicIp) {
      return jsonResponse(
        { ok: false, error: "No se pudo detectar una IP publica para recuperar la cuenta." },
        { status: 400 },
      );
    }

    const token = generateRecoveryToken();
    const tokenHash = hashRecoveryToken(token);
    let user: RecoveryUser | null = null;

    try {
      const db = getDb();
      const matches = await db.user.findMany({
        where: {
          lastLoginIp: publicIp,
          ...(name ? { name } : {}),
        },
        orderBy: { lastLoginAt: "desc" },
        take: name ? 1 : 10,
        select: { id: true, name: true },
      });

      if (matches.length === 0) {
        return jsonResponse({ ok: false, error: "No hay cuenta guardada para esta IP." }, { status: 404 });
      }
      if (!name && matches.length > 1) {
        return jsonResponse(
          {
            ok: false,
            error: "Hay varias cuentas en esta IP. Elige el soldado.",
            users: matches,
          },
          { status: 409 },
        );
      }

      user = matches[0] ?? null;
      if (!user) {
        return jsonResponse({ ok: false, error: "No hay cuenta guardada para esta IP." }, { status: 404 });
      }

      await db.user.update({
        where: { id: user.id },
        data: {
          tokenHash,
          tokenIssuedAt: new Date(),
          lastLoginAt: new Date(),
          lastLoginIp: publicIp,
        },
      });
    } catch (error) {
      if (!canUseFilesystemSessionFallback()) throw error;
      const filesystemSession = await recoverFilesystemSessionByIp(name, publicIp, token);
      if (!filesystemSession) {
        return jsonResponse({ ok: false, error: "No hay cuenta guardada para esta IP." }, { status: 404 });
      }
      user = { id: filesystemSession.userId, name: filesystemSession.userName };
    }

    return jsonResponse(
      { ok: true, token, user },
      { headers: { "Set-Cookie": sessionCookieHeader(buildSessionCookie(token)) } },
    );
  } catch (error) {
    return jsonResponse(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
