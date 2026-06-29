import nextConfig from "../../next.config";
import { SESSION_COOKIE_NAME, createFilesystemSession, generateRecoveryToken } from "../../src/lib/auth/session";

// Force the demo fallback path (no DATABASE_URL). Tests that exercise
// the database branch should set DATABASE_URL before running.
delete process.env.DATABASE_URL;
delete process.env.TERCIO_DEMO_STORE;

interface JsonResponse {
  status: number;
  body: unknown;
  headers: Headers;
}

async function callRoute(
  handler: (req: Request) => Promise<Response> | Response,
  init: RequestInit = {},
): Promise<JsonResponse> {
  const request = new Request("http://localhost/test", init);
  const response = await handler(request);
  const text = await response.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // leave body as text
  }
  return { status: response.status, body, headers: response.headers };
}

function expectShape(failures: string[], label: string, body: unknown, shape: Record<string, string>) {
  if (typeof body !== "object" || body === null) {
    failures.push(`${label} body is not an object`);
    return;
  }
  const obj = body as Record<string, unknown>;
  for (const [key, type] of Object.entries(shape)) {
    if (!(key in obj)) {
      failures.push(`${label} missing key ${key}`);
      continue;
    }
    const actual = typeof obj[key];
    if (actual !== type) {
      failures.push(`${label}.${key} is ${actual}, expected ${type}`);
    }
  }
}

async function main() {
  const failures: string[] = [];

  if (typeof nextConfig.headers !== "function") {
    failures.push("next.config missing headers()");
  } else {
    const headers = await nextConfig.headers();
    const apiRule = headers.find((rule) => rule.source === "/api/:path*");
    const cors = new Map(apiRule?.headers.map((header) => [header.key, header.value]));

    const expectedOrigin = process.env.TERCIO_CORS_ORIGIN ?? "https://tercios.yampi.eu";
    if (cors.get("Access-Control-Allow-Origin") !== expectedOrigin) {
      failures.push("CORS origin header missing for /api/:path*");
    }
    if (!cors.get("Access-Control-Allow-Methods")?.includes("OPTIONS")) {
      failures.push("CORS methods header missing OPTIONS");
    }
    if (!cors.get("Access-Control-Allow-Headers")?.includes("Content-Type")) {
      failures.push("CORS headers missing Content-Type");
    }
  }

  const catalogRoute = await import("../../src/app/api/catalog/route");
  const characterNamesRoute = await import("../../src/app/api/character-names/route");
  const authCreateRoute = await import("../../src/app/api/auth/create/route");
  const authResumeRoute = await import("../../src/app/api/auth/resume/route");
  const authRefreshRoute = await import("../../src/app/api/auth/refresh/route");
  const authLogoutRoute = await import("../../src/app/api/auth/logout/route");
  const authRecoverIpRoute = await import("../../src/app/api/auth/recover-ip/route");
  const healthRoute = await import("../../src/app/api/health/route");
  const stateRoute = await import("../../src/app/api/demo/state/route");
  const gameStateRoute = await import("../../src/app/api/game/state/route");
  const worldTickRoute = await import("../../src/app/api/cron/world-tick/route");
  const arenaOpponentsRoute = await import("../../src/app/api/arena/opponents/route");
  const playersRoute = await import("../../src/app/api/players/route");
  const playerProfileRoute = await import("../../src/app/api/players/[id]/route");

  for (const [name, route] of [
    ["catalog", catalogRoute],
    ["character names", characterNamesRoute],
    ["auth create", authCreateRoute],
    ["auth resume", authResumeRoute],
    ["auth refresh", authRefreshRoute],
    ["auth logout", authLogoutRoute],
    ["auth recover ip", authRecoverIpRoute],
    ["health", healthRoute],
    ["demo state", stateRoute],
    ["game state", gameStateRoute],
    ["arena opponents", arenaOpponentsRoute],
    ["players", playersRoute],
    ["player profile", playerProfileRoute],
  ] as const) {
    const handlers = route as Record<string, unknown>;
    if (!name.startsWith("auth") && typeof handlers.GET !== "function") failures.push(`${name} route missing GET`);
    if (typeof handlers.OPTIONS !== "function") failures.push(`${name} route missing OPTIONS`);
  }

  for (const [name, route] of [
    ["auth create", authCreateRoute],
    ["auth resume", authResumeRoute],
    ["auth refresh", authRefreshRoute],
    ["auth logout", authLogoutRoute],
    ["auth recover ip", authRecoverIpRoute],
  ] as const) {
    const handlers = route as Record<string, unknown>;
    if (typeof handlers.POST !== "function") failures.push(`${name} route missing POST`);
  }

  if (typeof stateRoute.PUT !== "function") failures.push("demo state route missing PUT");
  if (typeof gameStateRoute.PUT !== "function") failures.push("game state route missing PUT");
  if (typeof worldTickRoute.POST !== "function") failures.push("world tick route missing POST");

  // Shape + status: OPTIONS preflight for every API route returns 200.
  for (const [name, route] of [
    ["catalog", catalogRoute],
    ["character names", characterNamesRoute],
    ["auth create", authCreateRoute],
    ["auth resume", authResumeRoute],
    ["auth refresh", authRefreshRoute],
    ["auth logout", authLogoutRoute],
    ["auth recover ip", authRecoverIpRoute],
    ["health", healthRoute],
    ["demo state", stateRoute],
    ["game state", gameStateRoute],
    ["arena opponents", arenaOpponentsRoute],
    ["players", playersRoute],
    ["player profile", playerProfileRoute],
    ["world tick", worldTickRoute],
  ] as const) {
    const r = await callRoute((route as { OPTIONS: (req: Request) => Promise<Response> }).OPTIONS);
    if (r.status !== 200 && r.status !== 204) {
      failures.push(`${name} OPTIONS returned ${r.status}, expected 2xx`);
    }
  }

  // Health: 200 with ok=true and a catalog counts object.
  {
    const r = await callRoute((healthRoute as { GET: (req: Request) => Promise<Response> }).GET);
    if (r.status !== 200) failures.push(`health GET returned ${r.status}`);
    expectShape(failures, "health", r.body, { ok: "boolean" });
  }

  // Catalog: 200 with source + items array.
  {
    const r = await callRoute((catalogRoute as { GET: (req: Request) => Promise<Response> }).GET);
    if (r.status !== 200) failures.push(`catalog GET returned ${r.status}`);
    if (typeof r.body === "object" && r.body !== null) {
      const obj = r.body as Record<string, unknown>;
      if (!Array.isArray(obj.items)) failures.push("catalog body.items is not an array");
    } else {
      failures.push("catalog body is not an object");
    }
  }

  // Character names: 200 with firstNames and surnames arrays.
  {
    const r = await callRoute((characterNamesRoute as { GET: (req: Request) => Promise<Response> }).GET);
    if (r.status !== 200) failures.push(`character-names GET returned ${r.status}`);
    if (typeof r.body === "object" && r.body !== null) {
      const obj = r.body as Record<string, unknown>;
      if (!Array.isArray(obj.firstNames)) failures.push("character-names missing firstNames");
      if (!Array.isArray(obj.surnames)) failures.push("character-names missing surnames");
    }
  }

  // Auth create: 400 on invalid body (too short).
  {
    const r = await callRoute(
      (authCreateRoute as { POST: (req: Request) => Promise<Response> }).POST,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "x" }),
      },
    );
    if (r.status !== 400) failures.push(`auth/create short name returned ${r.status}`);
    expectShape(failures, "auth/create short", r.body, { ok: "boolean" });
  }

  // Auth create: 400 on invalid portrait.
  {
    const r = await callRoute(
      (authCreateRoute as { POST: (req: Request) => Promise<Response> }).POST,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Diego de Arce", portraitAssetId: "no_such_portrait" }),
      },
    );
    if (r.status !== 400) failures.push(`auth/create bad portrait returned ${r.status}`);
  }

  // Auth resume: 401 on missing token.
  {
    const r = await callRoute(
      (authResumeRoute as { POST: (req: Request) => Promise<Response> }).POST,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "" }),
      },
    );
    if (r.status !== 401) failures.push(`auth/resume empty token returned ${r.status}`);
  }

  // Auth resume: 401 on malformed token.
  {
    const r = await callRoute(
      (authResumeRoute as { POST: (req: Request) => Promise<Response> }).POST,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "not-a-real-token" }),
      },
    );
    if (r.status !== 401) failures.push(`auth/resume malformed returned ${r.status}`);
  }

  // Auth refresh: 401 when no session cookie is present.
  {
    const r = await callRoute((authRefreshRoute as { POST: (req: Request) => Promise<Response> }).POST, {
      method: "POST",
    });
    if (r.status !== 401) failures.push(`auth/refresh missing cookie returned ${r.status}`);
    if (!r.headers.get("set-cookie")?.toLowerCase().includes("tercio_session=")) {
      failures.push("auth/refresh missing cookie did not clear session cookie");
    }
  }

  // Auth refresh: 200 and Set-Cookie when the current cookie token is valid.
  {
    const refreshToken = generateRecoveryToken();
    await createFilesystemSession("Diego de Arce", refreshToken, "203.0.113.77");
    const r = await callRoute((authRefreshRoute as { POST: (req: Request) => Promise<Response> }).POST, {
      method: "POST",
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${refreshToken}`,
        "x-forwarded-for": "203.0.113.88",
      },
    });
    if (r.status !== 200) failures.push(`auth/refresh valid token returned ${r.status}`);
    const setCookie = r.headers.get("set-cookie") ?? "";
    if (!setCookie.includes(`${SESSION_COOKIE_NAME}=${refreshToken}`)) {
      failures.push("auth/refresh did not reissue session cookie");
    }
  }

  // Auth recover IP: GET exposes likely account names for the detected public IP.
  {
    const recoveryToken = generateRecoveryToken();
    await createFilesystemSession("Diego de Arce", recoveryToken, "203.0.113.77");
    const r = await callRoute((authRecoverIpRoute as { GET: (req: Request) => Promise<Response> }).GET, {
      method: "GET",
      headers: {
        "x-forwarded-for": "203.0.113.77",
      },
    });
    if (r.status !== 200) failures.push(`auth/recover-ip GET returned ${r.status}`);
    if (typeof r.body === "object" && r.body !== null) {
      const obj = r.body as Record<string, unknown>;
      if (!Array.isArray(obj.users)) failures.push("auth/recover-ip GET missing users array");
      const users = Array.isArray(obj.users) ? obj.users as Array<Record<string, unknown>> : [];
      if (!users.some((user) => user.name === "Diego de Arce")) {
        failures.push("auth/recover-ip GET did not suggest filesystem account");
      }
    }
  }

  // Auth recover IP: wrong typed name should fall back to IP candidates.
  {
    const recoveryToken = generateRecoveryToken();
    await createFilesystemSession("Diego de Arce", recoveryToken, "203.0.113.77");
    const r = await callRoute((authRecoverIpRoute as { POST: (req: Request) => Promise<Response> }).POST, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.77",
      },
      body: JSON.stringify({ name: "No me acuerdo" }),
    });
    if (r.status !== 409) failures.push(`auth/recover-ip wrong name returned ${r.status}, expected 409`);
    if (typeof r.body === "object" && r.body !== null) {
      const obj = r.body as Record<string, unknown>;
      const users = Array.isArray(obj.users) ? obj.users as Array<Record<string, unknown>> : [];
      if (!users.some((user) => user.name === "Diego de Arce")) {
        failures.push("auth/recover-ip wrong name did not suggest matching IP account");
      }
    }
  }

  // Auth recover IP: browser-visible IP hint is a production fallback when proxy IP has no account.
  {
    const recoveryToken = generateRecoveryToken();
    await createFilesystemSession("Diego de Arce", recoveryToken, "203.0.113.77");
    const r = await callRoute((authRecoverIpRoute as { POST: (req: Request) => Promise<Response> }).POST, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "198.51.100.9",
      },
      body: JSON.stringify({ publicIpHint: "203.0.113.77" }),
    });
    if (r.status !== 200) failures.push(`auth/recover-ip browser hint returned ${r.status}, expected 200`);
    if (typeof r.body === "object" && r.body !== null) {
      const obj = r.body as Record<string, unknown>;
      if (obj.ok !== true) failures.push("auth/recover-ip browser hint body.ok is not true");
      const user = obj.user as Record<string, unknown> | undefined;
      if (user?.name !== "Diego de Arce") {
        failures.push("auth/recover-ip browser hint did not recover hinted-IP account");
      }
    }
  }

  // Game state: 401 when no cookie is set (the demo fallback throws
  // UnauthorizedError when no session and no filesystem state).
  {
    const r = await callRoute((gameStateRoute as { GET: (req: Request) => Promise<Response> }).GET);
    if (r.status !== 401 && r.status !== 200) {
      failures.push(`game/state GET returned ${r.status}, expected 401 or 200`);
    }
  }

  // Demo state: 200 (filesystem fallback returns the initial state).
  {
    const r = await callRoute((stateRoute as { GET: (req: Request) => Promise<Response> }).GET);
    if (r.status !== 200) failures.push(`demo/state GET returned ${r.status}`);
    if (typeof r.body === "object" && r.body !== null) {
      const obj = r.body as Record<string, unknown>;
      if (obj.ok !== true) failures.push("demo/state body.ok is not true");
      if (typeof obj.state !== "object") failures.push("demo/state body.state is not an object");
    }
  }

  // Demo state PUT: 400 on missing state.
  {
    const r = await callRoute(
      (stateRoute as { PUT: (req: Request) => Promise<Response> }).PUT,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      },
    );
    if (r.status !== 400) failures.push(`demo/state PUT missing state returned ${r.status}`);
  }

  // Auth logout: 200 (no auth required).
  {
    const r = await callRoute((authLogoutRoute as { POST: (req: Request) => Promise<Response> }).POST, {
      method: "POST",
    });
    if (r.status !== 200) failures.push(`auth/logout returned ${r.status}`);
    if (r.headers.get("set-cookie")?.toLowerCase().includes("tercio_session=") === false) {
      failures.push("auth/logout did not clear session cookie");
    }
  }

  // Schema tokens.
  const schema = await import("node:fs").then((fs) => fs.readFileSync("prisma/schema.prisma", "utf8"));
  for (const token of ["isBot", "model ArenaBotProfile", "arenaBotProfile", "model ActiveMission", "model AuctionListing", "model ShopRotation", "model WorldJobRun", "model GameMessage"]) {
    if (!schema.includes(token)) failures.push(`schema missing ${token}`);
  }

  if (typeof worldTickRoute.OPTIONS !== "function") failures.push("world tick route missing OPTIONS");

  if (failures.length) {
    console.error(JSON.stringify({ ok: false, failures }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({ ok: true, checked: "backend-contract" }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
