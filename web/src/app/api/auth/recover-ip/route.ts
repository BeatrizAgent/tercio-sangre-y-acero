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

function normalizePublicIpHint(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 80 ? trimmed : null;
}

function uniqueIps(...values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

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
    const requestIp = getPublicIpFromRequest(request);
    const ipCandidates = uniqueIps(requestIp, normalizePublicIpHint(body.publicIpHint));
    if (ipCandidates.length === 0) {
      return jsonResponse(
        { ok: false, error: "No se pudo detectar una IP publica para recuperar la cuenta." },
        { status: 400 },
      );
    }

    const token = generateRecoveryToken();
    const tokenHash = hashRecoveryToken(token);
    let user: RecoveryUser | null = null;
    let publicIp = ipCandidates[0] ?? null;

    try {
      const db = getDb();
      let ipMatches: RecoveryUser[] = [];
      for (const candidateIp of ipCandidates) {
        const matches = await db.user.findMany({
          where: { lastLoginIp: candidateIp },
          orderBy: { lastLoginAt: "desc" },
          take: 10,
          select: { id: true, name: true },
        });
        if (matches.length > 0 || candidateIp === ipCandidates[ipCandidates.length - 1]) {
          publicIp = candidateIp;
          ipMatches = matches;
          break;
        }
      }
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
      let filesystemSession = null;
      for (const candidateIp of ipCandidates) {
        filesystemSession = await recoverFilesystemSessionByIp(name, candidateIp, token);
        if (filesystemSession) {
          publicIp = candidateIp;
          break;
        }
      }
      if (!filesystemSession) {
        let users: RecoveryUser[] = [];
        for (const candidateIp of ipCandidates) {
          users = (await listFilesystemRecoveryCandidatesByIp(candidateIp)).map((session) => ({
            id: session.userId,
            name: session.userName,
          }));
          if (users.length > 0) {
            publicIp = candidateIp;
            break;
          }
        }
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
