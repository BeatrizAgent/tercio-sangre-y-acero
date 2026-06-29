// Game-flow e2e: drives the real UI through a sequence of routes the
// player can take from the moment they log in. The auth step reuses the
// pattern from game-smoke.spec.ts (create a temporary soldier via
// /api/auth/create). Subsequent navigation is verified at the browser
// level: each page returns 200, renders a <main> + <header>, and emits
// no console / network errors.

import { expect, test, type Page, type Response } from "@playwright/test";

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
    issues.push({
      kind: "console",
      route: currentRoute,
      message: message.text(),
    });
  });

  page.on("pageerror", (error) => {
    issues.push({
      kind: "pageerror",
      route: currentRoute,
      message: error.message,
    });
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
  expect(issues, `${context}\n${JSON.stringify(issues, null, 2)}`).toEqual([]);
}

test.describe("Tercio game flow", () => {
  test("player can move from /soldier to /missions without browser errors", async ({ page, context }) => {
    const collector = attachIssueCollector(page);
    const name = `Flow ${Date.now()}`;

    // 1. Create a temporary soldier.
    const create = await context.request.post("/api/auth/create", {
      data: { name, portraitAssetId: "player_portrait_option_01_bisono_recruit" },
    });
    expect(create.ok(), await create.text()).toBe(true);

    // 2. Walk through a sequence of routes a player typically visits.
    const flow: readonly string[] = ["/soldier", "/missions"];

    for (const route of flow) {
      collector.setRoute(route);
      const response = await page.goto(route, { waitUntil: "networkidle" });
      expect(response?.ok(), `${route} returned ${response?.status()}`).toBe(true);
      await expect(page).toHaveURL(new RegExp(`${route.replace("/", "\\/")}$`));
      await expect(page.getByRole("banner")).toBeVisible();
      await expect(page.locator("main")).toBeVisible();
    }

    await expectNoBrowserIssues(collector.issues, "Game flow found browser issues");
  });
});
