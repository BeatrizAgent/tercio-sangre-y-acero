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
  "src/app/arena/page.tsx",
  "src/app/company/page.tsx",
  "src/app/recruitment/page.tsx",
  "src/lib/domain/resolver.ts",
  "src/lib/domain/reports.ts",
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

const routes = [
  fs.readFileSync(path.join(root, "src/components/game/sidebar-nav.tsx"), "utf8"),
  fs.readFileSync(path.join(root, "src/components/game/game-shell.tsx"), "utf8"),
].join("\n");
for (const route of ["/city", "/soldier", "/training", "/armory", "/missions", "/hospital", "/arena", "/company", "/recruitment"]) {
  if (!routes.includes(route)) failures.push(`nav missing ${route}`);
}

const types = fs.readFileSync(path.join(root, "src/lib/types.ts"), "utf8");
for (const typeName of ["ArenaOpponent", "ArenaResult"]) {
  if (!types.includes(`interface ${typeName}`)) failures.push(`types missing ${typeName}`);
}
for (const token of ["interface CharacterDefinition", "interface CharacterState", "interface SpriteSetDefinition", "type FormationSlot"]) {
  if (!types.includes(token)) failures.push(`types missing ${token}`);
}

const dataFiles = [
  "src/lib/data/index.ts",
  "src/lib/data/arena.ts",
  "src/lib/data/characters.ts",
].map((file) => fs.readFileSync(path.join(root, file), "utf8"));
const data = dataFiles.join("\n");
for (const token of ["arenaOpponents", "listArenaOpponents", "getArenaOpponent"]) {
  if (!data.includes(token)) failures.push(`game-data missing ${token}`);
}
for (const token of ["characterDefinitions", "spriteSetDefinitions", "getCharacterDefinition", "getSpriteSetDefinition"]) {
  if (!data.includes(token)) failures.push(`character roster data missing ${token}`);
}

const syncedCatalogPath = path.join(root, "data/json/catalog.json");
if (!fs.existsSync(syncedCatalogPath)) failures.push("synced catalog.json missing");
else {
  const catalog = JSON.parse(fs.readFileSync(syncedCatalogPath, "utf8"));
  const characters = catalog.characters ?? [];
  for (const id of ["recruit_diego_arce_001", "soldier_lope_saavedra_001", "soldier_martin_cuenca_001", "soldier_alonso_valdes_001", "soldier_sancho_leiva_001"]) {
    if (!characters.some((entry) => entry.id === id)) failures.push(`catalog characters missing ${id}`);
  }
}

const store = fs.readFileSync(path.join(root, "src/lib/stores/game-store.ts"), "utf8");
for (const token of ["arenaResults", "fightArenaOpponent"]) {
  if (!store.includes(token)) failures.push(`store missing ${token}`);
}
for (const token of ["characters", "activeCharacterId", "trainCharacterStat", "setActiveCharacter", "setFormationSlot", "recruitCandidate"]) {
  if (!store.includes(token)) failures.push(`store missing character roster ${token}`);
}

const cityPage = fs.readFileSync(path.join(root, "src/app/city/page.tsx"), "utf8");
for (const token of ["citySpots", "featuredAssetPaths.city", "cost:", "result:", "state:"]) {
  if (!cityPage.includes(token)) failures.push(`city UX missing ${token}`);
}

const arenaPage = fs.readFileSync(path.join(root, "src/app/arena/page.tsx"), "utf8");
for (const token of ["arena-opponent-row", "Rival", "Poder", "Botin"]) {
  if (!arenaPage.includes(token)) failures.push(`arena UX missing ${token}`);
}

const armoryPage = fs.readFileSync(path.join(root, "src/app/armory/page.tsx"), "utf8");
for (const token of ["armory-slot-grid", "ARMORY_CELL_SIZE", "getItemFootprint", "armory-dropzone", "draggable", "Arrastra"]) {
  if (!armoryPage.includes(token)) failures.push(`armory UX missing ${token}`);
}
if (armoryPage.includes("Inspeccion")) failures.push("armory UX still has inspection panel");

const formation = fs.readFileSync(path.join(root, "src/lib/domain/formation.ts"), "utf8");
for (const token of ["TercioFormationPresetId", "TERCIO_FORMATION_PRESETS", "cuadro_de_picas", "reserva_cerrada"]) {
  if (!formation.includes(token)) failures.push(`formation presets missing ${token}`);
}

const recruitment = [
  fs.readFileSync(path.join(root, "src/lib/data/recruitment.ts"), "utf8"),
  fs.readFileSync(path.join(root, "src/lib/domain/recruitment.ts"), "utf8"),
].join("\n");
for (const token of ["recruitmentCandidates", "canRecruitCandidate", "recruitCandidateInState", "tomas_de_orduna"]) {
  if (!recruitment.includes(token)) failures.push(`recruitment missing ${token}`);
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: required.length }, null, 2));
