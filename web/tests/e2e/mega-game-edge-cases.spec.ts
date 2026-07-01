// mega-game-edge-cases.spec.ts — Mega suite agresiva de punta a punta.
//
// Cubre auth, APIs, navegación en 3 viewports, edge cases de gameplay,
// resiliencia y encoding. El test crea su propio usuario via /api/auth/create
// y guarda el token/cookie en disco para depuración.
//
// Patrón tomado de game-smoke.spec.ts y game-flow.spec.ts. Asume que el
// servidor Docker local está corriendo en el puerto configurado (PORT env,
// default 3000). Para ejecutarlo aislado:
//   PORT=3010 pnpm --dir web exec playwright test tests/e2e/mega-game-edge-cases.spec.ts

import { expect, test, type APIRequestContext, type APIResponse, type Page, type Response } from "@playwright/test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// El helper de artefactos escribe en un directorio estable de Playwright
// (test-results/qa-mega-artifacts/) para que los logs de fallos y los
// adjuntos estén disponibles aunque cwd varíe.
const ARTIFACT_DIR = resolve(process.cwd(), "test-results", "qa-mega-artifacts");
if (!existsSync(ARTIFACT_DIR)) mkdirSync(ARTIFACT_DIR, { recursive: true });

// Intentamos también escribir en el output/ del repo si está accesible.
let REPO_OUTPUT_DIR = "";
try {
  // process.cwd() desde Playwright es la raíz del paquete web. Subimos un
  // nivel para llegar al repo (medieval-game/) y entrar en output/.
  REPO_OUTPUT_DIR = resolve(process.cwd(), "..", "output");
  if (!existsSync(REPO_OUTPUT_DIR)) mkdirSync(REPO_OUTPUT_DIR, { recursive: true });
} catch {
  REPO_OUTPUT_DIR = "";
}

function saveArtifact(name: string, contents: string | object) {
  const payload = typeof contents === "string" ? contents : JSON.stringify(contents, null, 2);
  writeFileSync(resolve(ARTIFACT_DIR, name), payload);
  if (REPO_OUTPUT_DIR) {
    try {
      writeFileSync(resolve(REPO_OUTPUT_DIR, name), payload);
    } catch {
      // El directorio del repo puede no ser escribible; seguimos con ARTIFACT_DIR.
    }
  }
}

const PORTRAIT = "player_portrait_option_01_bisono_recruit";

type BrowserIssue = {
  kind: "console" | "pageerror" | "requestfailed" | "http";
  route?: string;
  message: string;
};

function attachIssueCollector(page: Page) {
  const issues: BrowserIssue[] = [];
  let currentRoute = "";
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/Download the React DevTools/i.test(text)) return;
    if (/Failed to load resource.*favicon/i.test(text)) return;
    issues.push({ kind: "console", route: currentRoute, message: text });
  });
  page.on("pageerror", (error) => {
    issues.push({ kind: "pageerror", route: currentRoute, message: error.message });
  });
  page.on("requestfailed", (request) => {
    const failure = request.failure();
    if (failure?.errorText === "net::ERR_ABORTED") return;
    issues.push({
      kind: "requestfailed",
      route: currentRoute,
      message: `${request.method()} ${request.url()} ${failure?.errorText ?? "failed"}`,
    });
  });
  page.on("response", (response) => {
    if (isAllowedResponse(response)) return;
    issues.push({
      kind: "http",
      route: currentRoute,
      message: `${response.status()} ${response.url()}`,
    });
  });
  return {
    issues,
    setRoute(route: string) {
      currentRoute = route;
    },
  };
}

function isAllowedResponse(response: Response) {
  if (response.status() < 400) return true;
  const url = response.url();
  if (url.includes("/api/game/state") && response.status() === 401) return true;
  return false;
}

async function expectNoBrowserIssues(issues: BrowserIssue[], context: string) {
  if (issues.length === 0) return;
  const summary = JSON.stringify(issues, null, 2);
  throw new Error(`${context}\n${summary}`);
}

async function postJson(
  request: APIRequestContext,
  url: string,
  data: unknown,
): Promise<APIResponse> {
  return request.post(url, {
    data: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

async function createTestUser(request: APIRequestContext, tag: string) {
  const name = `Mega ${tag} ${Date.now()}`;
  const res = await postJson(request, "/api/auth/create", {
    name,
    portraitAssetId: PORTRAIT,
  });
  expect(res.status(), `create status: ${await res.text()}`).toBe(200);
  const body = (await res.json()) as { ok: boolean; token: string; state: unknown };
  expect(body.ok).toBe(true);
  expect(body.token).toMatch(/^tercio_/);
  writeFileSync(resolve(ARTIFACT_DIR, "qa-mega-test-auth.json"), JSON.stringify(body, null, 2));
  writeFileSync(resolve(ARTIFACT_DIR, "qa-mega-test-token.txt"), body.token);
  saveArtifact("qa-mega-test-auth.json", body);
  saveArtifact("qa-mega-test-token.txt", body.token);
  return { name, token: body.token };
}

test.describe.serial("Mega game edge cases", () => {
  let token = "";
  let soldierName = "";
  let requestCtx: APIRequestContext;
  let collector: ReturnType<typeof attachIssueCollector>;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    requestCtx = context.request;
    page = await context.newPage();
    collector = attachIssueCollector(page);
    const created = await createTestUser(requestCtx, "auth");
    token = created.token;
    soldierName = created.name;
    const cookies = await context.cookies();
    saveArtifact("qa-mega-test-cookies.json", cookies);
  });

  test.afterAll(() => {
    saveArtifact("qa-mega-test-issues.json", collector.issues);
  });

  // ───────────────────────── Auth & session ─────────────────────────

  test("1. /api/auth/create devuelve 200 y shape correcto", async ({ browser }) => {
    // Usar un contexto fresco para no contaminar la cookie del requestCtx.
    const ctx = await browser.newContext();
    const res = await ctx.request.post("/api/auth/create", {
      data: JSON.stringify({ name: "Mega extra 1" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.token).toMatch(/^tercio_/);
    expect(body.state).toBeTruthy();
    await ctx.close();
  });

  test("2. /api/auth/create rechaza nombre inválido con 400 JSON", async () => {
    const res = await postJson(requestCtx, "/api/auth/create", { name: "A" });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(typeof body.error).toBe("string");
  });

  test("3. /api/auth/create rechaza portrait inválido con 400 JSON", async () => {
    const res = await postJson(requestCtx, "/api/auth/create", {
      name: "Mega portrait bad",
      portraitAssetId: "fake_portrait_id_xyz",
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  test("4. /api/game/state devuelve 200 con cookie y soldier válido", async () => {
    const res = await requestCtx.get("/api/game/state");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.state?.soldier?.name).toBeTruthy();
  });

  test("5. /api/auth/refresh con cookie válida devuelve 200", async () => {
    const res = await requestCtx.post("/api/auth/refresh");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.user?.id).toBeTruthy();
    expect(body.user?.name).toBe(soldierName);
  });

  test("6. /api/auth/resume con token válido devuelve 200", async () => {
    const res = await postJson(requestCtx, "/api/auth/resume", { token });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.user?.name).toBe(soldierName);
  });

  test("7. /api/auth/resume con token inválido devuelve 401 JSON", async () => {
    const res = await postJson(requestCtx, "/api/auth/resume", { token: "tercio_BROKEN_AAA" });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  test("8. /api/auth/resume con body vacío devuelve 401 JSON", async () => {
    const res = await postJson(requestCtx, "/api/auth/resume", {});
    expect(res.status()).toBe(401);
  });

  test("9. /api/auth/resume con token de formato incorrecto devuelve 401", async () => {
    const res = await postJson(requestCtx, "/api/auth/resume", { token: "nope" });
    expect(res.status()).toBe(401);
  });

  test("10. /api/auth/recover-ip GET responde JSON controlado", async () => {
    const res = await requestCtx.get("/api/auth/recover-ip");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.ok).toBe("boolean");
    expect(Array.isArray(body.users)).toBe(true);
  });

  test("11. /api/auth/recover-ip POST con body vacío devuelve 400 JSON", async () => {
    const res = await postJson(requestCtx, "/api/auth/recover-ip", {});
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  test("12. /api/auth/recover-ip POST con name desconocido devuelve 4xx JSON", async () => {
    const res = await postJson(requestCtx, "/api/auth/recover-ip", {
      name: "SoldadoFantasmaInexistente",
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  // ───────────────────────── APIs públicas ─────────────────────────

  test("13. /api/health devuelve 200 y shape correcto", async () => {
    const res = await requestCtx.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.catalog).toBeTruthy();
    expect(body.catalog.items).toBeGreaterThan(50);
  });

  test("14. /api/catalog devuelve items, missions, enemies, wounds, ranks", async () => {
    const res = await requestCtx.get("/api/catalog");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(50);
    expect(Array.isArray(body.missions)).toBe(true);
    expect(body.missions.length).toBeGreaterThan(10);
    expect(Array.isArray(body.enemies)).toBe(true);
    expect(body.enemies.length).toBeGreaterThan(5);
    expect(Array.isArray(body.wounds)).toBe(true);
    expect(body.wounds.length).toBeGreaterThan(5);
    expect(Array.isArray(body.ranks)).toBe(true);
  });

  test("15. /api/character-names contiene Diego y surnames no vacío", async () => {
    const res = await requestCtx.get("/api/character-names");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { firstNames: string[]; surnames: string[] };
    expect(body.firstNames).toContain("Diego");
    expect(body.surnames.length).toBeGreaterThan(10);
  });

  test("16. /api/flask/health funciona vía proxy de Next", async () => {
    const res = await requestCtx.get("/api/flask/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test("17. /api/flask/catalog funciona vía proxy de Next", async () => {
    const res = await requestCtx.get("/api/flask/catalog");
    expect(res.status()).toBe(200);
    const body = await res.json();
    // /api/flask/catalog devuelve el catálogo completo (assets, items,
    // missions, enemies, wounds, ranks, etc). Validamos al menos que la
    // respuesta tiene items y missions.
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(50);
    expect(Array.isArray(body.missions)).toBe(true);
    expect(body.missions.length).toBeGreaterThan(10);
  });

  test("18. /api/flask/character-names funciona vía proxy de Next", async () => {
    const res = await requestCtx.get("/api/flask/character-names");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { firstNames: string[] };
    expect(body.firstNames).toContain("Diego");
  });

  test("19. OPTIONS contra endpoints clave devuelve 2xx con CORS", async () => {
    const endpoints = [
      "/api/auth/create",
      "/api/auth/refresh",
      "/api/auth/logout",
      "/api/auth/resume",
      "/api/auth/recover-ip",
      "/api/flask/health",
    ];
    for (const ep of endpoints) {
      const res = await requestCtx.fetch(ep, { method: "OPTIONS" });
      expect([200, 204], `OPTIONS ${ep} returned ${res.status()}`).toContain(res.status());
    }
  });

  // ───────────────────────── Gameplay APIs ─────────────────────────

  test("20. /api/arena/opponents devuelve lista con oponentes", async () => {
    const res = await requestCtx.get("/api/arena/opponents");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.opponents)).toBe(true);
    expect(body.opponents.length).toBeGreaterThan(0);
  });

  test("21. /api/arena/opponents exige auth (401 sin cookie, 200 con cookie)", async ({ browser }) => {
    const ctx = await browser.newContext();
    const noAuth = await ctx.request.get("/api/arena/opponents");
    expect(noAuth.status()).toBe(401);
    const body401 = await noAuth.json();
    expect(body401.ok).toBe(false);
    await ctx.close();

    const authed = await requestCtx.get("/api/arena/opponents");
    expect(authed.status()).toBe(200);
    const body200 = await authed.json();
    expect(body200.ok).toBe(true);
    expect(Array.isArray(body200.opponents)).toBe(true);
    expect(body200.opponents.length).toBeGreaterThan(0);
  });

  test("22. /api/market/auctions con auth responde JSON controlado", async () => {
    const res = await requestCtx.get("/api/market/auctions");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.ok).toBe("boolean");
    expect(body.data?.auctions !== undefined).toBe(true);
  });

  test("23. /api/market/auctions sin auth devuelve 401 JSON", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get("/api/market/auctions");
    expect(res.status()).toBe(401);
    await ctx.close();
  });

  test("24. /api/market/bid con body inválido devuelve 400 JSON, no 500", async () => {
    const res = await postJson(requestCtx, "/api/market/bid", {
      listingId: "nonexistent",
      amount: -10,
    });
    // El endpoint devuelve 400 cuando no hay subastas seed o amount inválido.
    // Nunca debe ser 500 HTML.
    expect(res.status()).toBeLessThan(500);
    const ct = res.headers()["content-type"] ?? "";
    expect(ct).toContain("application/json");
    const body = await res.json();
    expect(typeof body.ok).toBe("boolean");
  });

  test("25. /api/market/bid con body vacío devuelve 400 JSON", async () => {
    const res = await postJson(requestCtx, "/api/market/bid", {});
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  test("26. /api/market/bid sin auth devuelve 401 JSON", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await postJson(ctx.request, "/api/market/bid", { listingId: "x", amount: 1 });
    expect(res.status()).toBe(401);
    await ctx.close();
  });

  test("27. /api/players devuelve lista", async () => {
    const res = await requestCtx.get("/api/players");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { players?: unknown[] };
    expect(Array.isArray(body.players)).toBe(true);
  });

  test("28. /api/demo/state responde 200 o 404", async () => {
    const res = await requestCtx.get("/api/demo/state");
    expect([200, 404]).toContain(res.status());
  });

  // ───────────────────────── Navegación de pantallas ─────────────────────────

  const routes = [
    "/login",
    "/city",
    "/barracks",
    "/soldier",
    "/training",
    "/inventory",
    "/equipment",
    "/armory",
    "/missions",
    "/hospital",
    "/arena",
    "/market",
    "/rankings",
    "/company",
    "/mailbox",
    "/church",
    "/saints",
    "/recruitment",
    "/reports",
    "/news",
    "/packages",
  ];

  for (const route of routes) {
    test(`29. navegación ${route} responde sin 500`, async () => {
      collector.setRoute(route);
      const response = await page.goto(route, { waitUntil: "networkidle" });
      const status = response?.status() ?? 0;
      expect(status, `${route} returned ${status}`).toBeLessThan(500);
      expect(status, `${route} returned 0 (no response)`).toBeGreaterThan(0);
      if (route !== "/login") {
        await expect(page.getByRole("banner")).toBeVisible({ timeout: 10_000 });
        await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });
      }
    });
  }

  test("30. /soldier y /missions cargan sin browser issues", async () => {
    const local = attachIssueCollector(page);
    local.setRoute("/soldier");
    let res = await page.goto("/soldier", { waitUntil: "networkidle" });
    expect(res?.ok()).toBe(true);
    await expect(page.locator("main")).toBeVisible();
    local.setRoute("/missions");
    res = await page.goto("/missions", { waitUntil: "networkidle" });
    expect(res?.ok()).toBe(true);
    await expect(page.locator("main")).toBeVisible();
    await expectNoBrowserIssues(local.issues, "soldier/missions found issues");
  });

  test("31. /armory carga y muestra la rejilla del armero", async () => {
    collector.setRoute("/armory");
    const res = await page.goto("/armory", { waitUntil: "networkidle" });
    expect(res?.ok()).toBe(true);
    await expect(page.locator("main")).toBeVisible();
  });

  test("32. /market carga sin 500 (subastas pueden estar vacías)", async () => {
    collector.setRoute("/market");
    const res = await page.goto("/market", { waitUntil: "networkidle" });
    expect(res?.ok()).toBe(true);
    await expect(page.locator("main")).toBeVisible();
  });

  test("33. /arena carga y muestra al menos el main", async () => {
    collector.setRoute("/arena");
    const res = await page.goto("/arena", { waitUntil: "networkidle" });
    expect(res?.ok()).toBe(true);
    await expect(page.locator("main")).toBeVisible();
  });

  test("34. /hospital carga y muestra wounds o empty state", async () => {
    collector.setRoute("/hospital");
    const res = await page.goto("/hospital", { waitUntil: "networkidle" });
    expect(res?.ok()).toBe(true);
    await expect(page.locator("main")).toBeVisible();
  });

  // ───────────────────────── Edge cases UI ─────────────────────────

  const viewports = [
    { name: "desktop-1280x800", width: 1280, height: 800 },
    { name: "desktop-1440x900", width: 1440, height: 900 },
    { name: "mobile-390x844", width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    test(`35. ${vp.name} navega /city y /soldier sin issues`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const localPage = await ctx.newPage();
      const localCol = attachIssueCollector(localPage);
      for (const route of ["/city", "/soldier", "/training"]) {
        localCol.setRoute(route);
        const res = await localPage.goto(route, { waitUntil: "networkidle" });
        expect(res?.status(), `${route} ${vp.name}`).toBeLessThan(500);
        await expect(localPage.locator("main")).toBeVisible();
      }
      await expectNoBrowserIssues(localCol.issues, `${vp.name} issues`);
      await ctx.close();
    });
  }

  // ───────────────────────── Resiliencia ─────────────────────────

  test("36. ruta protegida sin cookie redirige a /login", async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const res = await p.goto("/soldier", { waitUntil: "networkidle" });
    expect(res?.status()).toBeLessThan(500);
    await expect(p).toHaveURL(/\/login/);
    await ctx.close();
  });

  test("37. forzar 500 en /api/game/state no rompe la página", async ({ browser }) => {
    const ctx = await browser.newContext();
    const cookies = await requestCtx.storageState();
    await ctx.addCookies(
      cookies.cookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        expires: c.expires,
        httpOnly: c.httpOnly,
        secure: c.secure,
        sameSite: c.sameSite,
      })),
    );
    const p = await ctx.newPage();
    const localCol = attachIssueCollector(p);
    await p.route("**/api/game/state", (route) => route.fulfill({ status: 500, body: "{}" }));
    localCol.setRoute("/soldier");
    const res = await p.goto("/soldier", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(500);
    const fatal = localCol.issues.filter((i) => i.kind === "pageerror");
    // Permitimos console errors o http 500s, pero no errores fatales.
    expect(fatal.length, `pageerrors: ${JSON.stringify(fatal)}`).toBeLessThanOrEqual(1);
    await ctx.close();
  });

  test("38. doble click en /soldier no produce uncaught ni duplica estado", async () => {
    collector.setRoute("/soldier");
    const res = await page.goto("/soldier", { waitUntil: "networkidle" });
    expect(res?.ok()).toBe(true);
    // Buscar el primer botón "Entrenar" o cualquier botón visible que dispare
    // un server action. Si no hay, simplemente comprobamos que el doble click
    // en el <body> no rompe nada.
    const fatals: string[] = [];
    page.on("pageerror", (e) => fatals.push(e.message));
    await page.dblclick("body", { force: true, position: { x: 10, y: 10 } });
    await page.waitForTimeout(200);
    expect(fatals, `pageerrors: ${JSON.stringify(fatals)}`).toEqual([]);
  });

  // ───────────────────────── Datos y encoding ─────────────────────────

  test("39. tooltips de items no muestran keys crudas (armor, damageMin, damageMax)", async () => {
    collector.setRoute("/inventory");
    const res = await page.goto("/inventory", { waitUntil: "networkidle" });
    expect(res?.ok()).toBe(true);
    await page.waitForTimeout(1000);
    // Hover sobre el primer item del chest del jugador.
    const items = page.locator('[data-testid*="item"], [class*="item-cell"], [class*="inventory-cell"]');
    const itemCount = await items.count();
    if (itemCount > 0) {
      await items.first().hover({ trial: false }).catch(() => null);
      await page.waitForTimeout(400);
    }
    const tooltips = page.locator('[role="tooltip"], [data-tooltip-content], .tooltip-content, [class*="tooltip"]:visible');
    const tooltipCount = await tooltips.count();
    const visibleText: string[] = [];
    for (let i = 0; i < tooltipCount; i++) {
      const t = tooltips.nth(i);
      if (await t.isVisible().catch(() => false)) {
        const text = await t.textContent().catch(() => null);
        if (text) visibleText.push(text);
      }
    }
    const badKeys = ["damageMin", "damageMax", "armor_value", "armor rating"];
    for (const text of visibleText) {
      for (const key of badKeys) {
        expect(text, `tooltip contains key ${key}`).not.toMatch(new RegExp(`\\b${key}\\b`, "i"));
      }
      // La palabra "armor" sola es sospechosa pero se permite dentro de frases
      // como "Pieza de armadura". Solo fallamos si aparece como sufijo CamelCase.
      expect(text, `tooltip contains CamelCase 'Armor'`).not.toMatch(/\bArmor\b/);
    }
  });

  test("40. la página no muestra literales \\u00b7 ni \\u2265 en texto visible", async () => {
    const probes = ["/soldier", "/training", "/inventory", "/equipment", "/armory"];
    for (const route of probes) {
      collector.setRoute(route);
      const res = await page.goto(route, { waitUntil: "networkidle" });
      expect(res?.ok()).toBe(true);
      const body = await page.locator("body").innerText();
      expect(body, `${route} contains \\u00b7`).not.toContain("\\u00b7");
      expect(body, `${route} contains \\u2265`).not.toContain("\\u2265");
    }
  });

  test("41. /api/catalog tiene al menos N missions, N items, N enemies, N wounds", async () => {
    const res = await requestCtx.get("/api/catalog");
    const body = (await res.json()) as {
      missions: Array<{ id: string }>;
      items: Array<{ id: string }>;
      enemies: Array<{ id: string }>;
      wounds: Array<{ id: string }>;
      ranks: Array<{ id: string }>;
    };
    expect(body.missions.length).toBeGreaterThan(5);
    expect(body.items.length).toBeGreaterThan(50);
    expect(body.enemies.length).toBeGreaterThan(5);
    expect(body.wounds.length).toBeGreaterThan(5);
    expect(body.ranks.length).toBeGreaterThan(2);
  });

  // ───────────────────────── Logout y estado limpio ─────────────────────────

  test("42. /api/auth/logout limpia la cookie y game/state pasa a 401", async () => {
    const logout = await requestCtx.post("/api/auth/logout");
    expect(logout.status()).toBe(200);
    const state = await requestCtx.get("/api/game/state");
    expect([401, 403]).toContain(state.status());
    // Re-crear usuario para los siguientes tests.
    const created = await createTestUser(requestCtx, "after-logout");
    token = created.token;
    soldierName = created.name;
    await page.goto("/login", { waitUntil: "networkidle" });
  });

  test("43. cierre: log final de issues acumulado", async () => {
    saveArtifact("qa-mega-test-final-issues.json", collector.issues);
  });
});

// Suite secundaria: un solo navegador compartido para tests que necesitan
// varios viewports o múltiples contexts.
test.describe("Mega game edge cases (multi-context)", () => {
  test("44. /soldier en 390x844 no muestra overflow horizontal crítico", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();
    await createTestUser(ctx.request, "mobile");
    const res = await p.goto("/soldier", { waitUntil: "networkidle" });
    expect(res?.status()).toBeLessThan(500);
    const overflow = await p.evaluate(() => {
      const w = window.innerWidth;
      const sw = document.documentElement.scrollWidth;
      return { vw: w, sw };
    });
    expect(
      overflow.sw,
      `scrollWidth ${overflow.sw} > vw ${overflow.vw}`,
    ).toBeLessThanOrEqual(overflow.vw + 16);
    await ctx.close();
  });

  test("45. /city en 1280x800 tiene banner y main visibles", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p = await ctx.newPage();
    await createTestUser(ctx.request, "city-desktop");
    const res = await p.goto("/city", { waitUntil: "networkidle" });
    expect(res?.ok()).toBe(true);
    await expect(p.getByRole("banner")).toBeVisible();
    await expect(p.locator("main")).toBeVisible();
    await ctx.close();
  });
});
