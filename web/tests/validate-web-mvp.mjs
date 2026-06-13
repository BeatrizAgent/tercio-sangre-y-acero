import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "src/app/barracks/page.tsx",
  "src/app/training/page.tsx",
  "src/app/armory/page.tsx",
  "src/app/inventory/page.tsx",
  "src/app/equipment/page.tsx",
  "src/app/missions/page.tsx",
  "src/app/missions/[id]/page.tsx",
  "src/app/reports/[id]/page.tsx",
  "src/lib/resolver.ts",
  "src/lib/reports.ts",
  "src/lib/actions.ts",
  "prisma/schema.prisma",
  "prisma/seed.ts",
];

const failures = [];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`missing ${file}`);
}

const schema = fs.readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
for (const model of [
  "User",
  "Soldier",
  "SoldierStats",
  "ItemDefinition",
  "InventoryItem",
  "Equipment",
  "MissionDefinition",
  "MissionResult",
  "WoundDefinition",
  "ActiveWound",
  "ShopItem",
  "TrainingLog",
  "LootTable",
  "ReportFragment",
]) {
  if (!schema.includes(`model ${model}`)) failures.push(`schema missing ${model}`);
}

const routes = fs.readFileSync(path.join(root, "src/app/layout.tsx"), "utf8");
for (const route of ["/barracks", "/soldier", "/training", "/inventory", "/equipment", "/armory", "/missions", "/hospital"]) {
  if (!routes.includes(route)) failures.push(`nav missing ${route}`);
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: required.length }, null, 2));
