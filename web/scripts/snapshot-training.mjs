import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const OUT_DIR = "../output";
await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
});

const createResponse = await context.request.post("http://localhost:3010/api/auth/create", {
  data: { name: "Capitan Demo" },
});
const createBody = await createResponse.json();
console.log("session:", createBody.token, "name:", createBody.state?.soldier?.name);

const page = await context.newPage();
await page.goto("http://localhost:3010/training", { waitUntil: "networkidle", timeout: 30_000 });
await page.waitForSelector('[data-testid^="train-step-"]', { timeout: 15_000 });
await page.waitForTimeout(600);

await page.screenshot({ path: `${OUT_DIR}/training-full.png`, fullPage: true });
console.log("full ->", `${OUT_DIR}/training-full.png`);

await page.screenshot({ path: `${OUT_DIR}/training-viewport.png`, fullPage: false });
console.log("viewport ->", `${OUT_DIR}/training-viewport.png`);

const pikeCard = page.locator('[data-testid="train-step-pike"]').first();
const pikeCardHandle = await pikeCard.elementHandle();
if (pikeCardHandle) {
  await pikeCardHandle.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(300);
  await pikeCardHandle.screenshot({ path: `${OUT_DIR}/training-pike-card.png` });
  console.log("pike card ->", `${OUT_DIR}/training-pike-card.png`);
}

const sidebar = page.locator("aside").last();
await sidebar.screenshot({ path: `${OUT_DIR}/training-sidebar.png` });
console.log("sidebar ->", `${OUT_DIR}/training-sidebar.png`);

const pikeButton = await page.locator('[data-testid="train-step-pike"]').first().elementHandle();
if (pikeButton) {
  await pikeButton.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT_DIR}/training-after-click.png`, fullPage: false });
  console.log("after click ->", `${OUT_DIR}/training-after-click.png`);
}

await browser.close();
console.log("done");
