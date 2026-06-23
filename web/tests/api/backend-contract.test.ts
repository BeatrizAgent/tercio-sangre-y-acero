import nextConfig from "../../next.config";

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
  const authLogoutRoute = await import("../../src/app/api/auth/logout/route");
  const healthRoute = await import("../../src/app/api/health/route");
  const stateRoute = await import("../../src/app/api/demo/state/route");

  for (const [name, route] of [
    ["catalog", catalogRoute],
    ["character names", characterNamesRoute],
    ["auth create", authCreateRoute],
    ["auth resume", authResumeRoute],
    ["auth logout", authLogoutRoute],
    ["health", healthRoute],
    ["demo state", stateRoute],
  ] as const) {
    const handlers = route as Record<string, unknown>;
    if (!name.startsWith("auth") && typeof handlers.GET !== "function") failures.push(`${name} route missing GET`);
    if (typeof handlers.OPTIONS !== "function") failures.push(`${name} route missing OPTIONS`);
  }

  for (const [name, route] of [
    ["auth create", authCreateRoute],
    ["auth resume", authResumeRoute],
    ["auth logout", authLogoutRoute],
  ] as const) {
    const handlers = route as Record<string, unknown>;
    if (typeof handlers.POST !== "function") failures.push(`${name} route missing POST`);
  }

  if (typeof stateRoute.PUT !== "function") failures.push("demo state route missing PUT");

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
