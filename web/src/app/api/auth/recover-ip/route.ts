import { jsonResponse, optionsResponse } from "@/lib/api/cors";
import {
  buildSessionCookie,
  canUseFilesystemSessionFallback,
  generateRecoveryToken,
  getPublicIpFromRequest,
  hashRecoveryToken,
  listFilesystemRecoveryCandidatesByIp,
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
  if (!publicIp) return jsonResponse({ ok: false, publicIp, users: [] });

  try {
    const db = getDb();
    const users = await db.user.findMany({
      where: { lastLoginIp: publicIp },
      orderBy: { lastLoginAt: "desc" },
      take: 10,
      select: { id: true, name: true },
    });
    return jsonResponse({ ok: true, publicIp, users });
  } catch (error) {
    if (!canUseFilesystemSessionFallback()) throw error;
    const users = (await listFilesystemRecoveryCandidatesByIp(publicIp)).map((session) => ({
      id: session.userId,
      name: session.userName,
    }));
    return jsonResponse({ ok: true, publicIp, users });
  }
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
      const ipMatches = await db.user.findMany({
        where: {
          lastLoginIp: publicIp,
        },
        orderBy: { lastLoginAt: "desc" },
        take: 10,
        select: { id: true, name: true },
      });
      const matches = name ? ipMatches.filter((match) => match.name === name) : ipMatches;

      if (ipMatches.length === 0) {
        return jsonResponse({ ok: false, error: "No hay cuenta guardada para esta IP." }, { status: 404 });
      }
      if (matches.length === 0 || (!name && matches.length > 1)) {
        return jsonResponse(
          {
            ok: false,
            error: name
              ? "No coincide ese nombre. Elige uno de los soldados guardados en esta IP."
              : "Hay varias cuentas en esta IP. Elige el soldado.",
            users: ipMatches,
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
        const users = (await listFilesystemRecoveryCandidatesByIp(publicIp)).map((session) => ({
          id: session.userId,
          name: session.userName,
        }));
        if (users.length > 0) {
          return jsonResponse(
            {
              ok: false,
              error: "No coincide ese nombre. Elige uno de los soldados guardados en esta IP.",
              users,
            },
            { status: 409 },
          );
        }
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
