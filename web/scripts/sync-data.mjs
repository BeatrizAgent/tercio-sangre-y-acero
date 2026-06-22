import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDataDir = path.resolve(__dirname, "../../data");
const targetDataDir = path.resolve(__dirname, "../data/json");
const rootAssetDir = path.resolve(__dirname, "../../GPT-ASSETS");
const targetAssetDir = path.resolve(__dirname, "../public/assets/gpt-bank");

async function main() {
  try {
    await fs.mkdir(targetDataDir, { recursive: true });

    // Primary data file — the unified catalog. The web app reads this directly.
    const files = ["catalog.json", "shops.json"];

    console.log(`Syncing data from ${rootDataDir} to ${targetDataDir}...`);

    for (const file of files) {
      const srcPath = path.join(rootDataDir, file);
      const destPath = path.join(targetDataDir, file);

      try {
        await fs.copyFile(srcPath, destPath);
        console.log(`  ✓ Synced ${file}`);
      } catch (err) {
        console.error(`  ✗ Failed to sync ${file}:`, err.message);
      }
    }

    console.log("Data synchronization complete.");

    await fs.rm(targetAssetDir, { recursive: true, force: true });
    await fs.mkdir(path.dirname(targetAssetDir), { recursive: true });
    await fs.cp(rootAssetDir, targetAssetDir, { recursive: true });
    console.log(`Synced GPT asset bank to ${targetAssetDir}.`);
  } catch (err) {
    console.error("Critical error syncing data:", err);
    process.exit(1);
  }
}

main();
