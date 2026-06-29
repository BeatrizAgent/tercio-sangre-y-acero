import { expect, test, type Page, type Response } from "@playwright/test";

const protectedRoutes = [
  "/city",
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
] as const;

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

test.describe("Tercio browser smoke", () => {
  test("redirects visitors to login without browser errors", async ({ page }) => {
    const collector = attachIssueCollector(page);
    collector.setRoute("/city");

    await page.goto("/city", { waitUntil: "networkidle" });

    await expect(page).toHaveURL(/\/login\?reason=missing-session$/);
    await expect(page.getByRole("heading", { name: "Entra al tercio" })).toBeVisible();
    await expectNoBrowserIssues(collector.issues, "Visitor smoke found browser issues");
  });

  test("creates a temporary soldier and loads protected game routes cleanly", async ({ page, context }) => {
    const collector = attachIssueCollector(page);
    const name = `E2E ${Date.now()}`;

    const createResponse = await context.request.post("/api/auth/create", {
      data: {
        name,
        portraitAssetId: "player_portrait_option_01_bisono_recruit",
      },
    });
    expect(createResponse.ok(), await createResponse.text()).toBe(true);

    const createPayload = (await createResponse.json()) as {
      ok?: boolean;
      token?: string;
      state?: { soldier?: { name?: string } };
    };
    expect(createPayload.ok).toBe(true);
    expect(createPayload.token).toMatch(/^tercio_/);
    expect(createPayload.state?.soldier?.name).toBe(name);

    const stateResponse = await context.request.get("/api/game/state");
    expect(stateResponse.ok(), await stateResponse.text()).toBe(true);
    const statePayload = (await stateResponse.json()) as {
      ok?: boolean;
      state?: { soldier?: { name?: string } };
    };
    expect(statePayload.ok).toBe(true);
    expect(statePayload.state?.soldier?.name).toBeTruthy();

    for (const route of protectedRoutes) {
      collector.setRoute(route);
      const response = await page.goto(route, { waitUntil: "networkidle" });
      expect(response?.ok(), `${route} returned ${response?.status()}`).toBe(true);
      await expect(page).toHaveURL(new RegExp(`${route.replace("/", "\\/")}$`));
      await expect(page.getByRole("heading", { name: "Entra al tercio" })).toBeHidden();
      await expect(page.locator("main")).toBeVisible();
      await expect(page.getByRole("banner")).toBeVisible();
    }

    await expectNoBrowserIssues(collector.issues, "Authenticated route smoke found browser issues");
  });
});
