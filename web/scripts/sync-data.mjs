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
    // Create target directory if it doesn't exist
    await fs.mkdir(targetDataDir, { recursive: true });

    // List of JSON files to copy
    const files = [
      "assets.json",
      "enemies.json",
      "events.json",
      "items.json",
      "loot_tables.json",
      "missions.json",
      "ranks.json",
      "report_fragments.json",
      "shops.json",
      "wounds.json"
    ];

    console.log(`Syncing mock data from ${rootDataDir} to ${targetDataDir}...`);

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

    console.log("Mock data synchronization complete.");

    await fs.rm(targetAssetDir, { recursive: true, force: true });
    await fs.mkdir(path.dirname(targetAssetDir), { recursive: true });
    await fs.cp(rootAssetDir, targetAssetDir, { recursive: true });
    console.log(`Synced GPT asset bank to ${targetAssetDir}.`);
  } catch (err) {
    console.error("Critical error syncing mock data:", err);
    process.exit(1);
  }
}

main();
