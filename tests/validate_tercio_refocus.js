const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const failures = [];

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function json(relPath) {
  try {
    return JSON.parse(read(relPath));
  } catch (error) {
    failures.push(`${relPath}: ${error.message}`);
    return null;
  }
}

function requireFile(relPath) {
  if (!exists(relPath)) failures.push(`missing ${relPath}`);
}

[
  "project.godot",
  "AGENTS.md",
  "scripts/core/GameState.gd",
  "scripts/managers/SoldierManager.gd",
  "scripts/managers/EquipmentManager.gd",
  "scripts/managers/TrainingManager.gd",
  "scripts/managers/MissionManager.gd",
  "scripts/resolution/CombatResolver.gd",
  "scripts/resolution/ReportGenerator.gd",
  "scenes/barracks/BarracksScreen.tscn",
  "scenes/training/TrainingScreen.tscn",
  "scenes/inventory/InventoryScreen.tscn",
  "scenes/shop/ShopScreen.tscn",
  "scenes/missions/MissionsScreen.tscn",
  "scenes/reports/CombatReportScreen.tscn",
  "scenes/hospital/HospitalScreen.tscn",
  "scenes/ui/EventLogScreen.tscn",
].forEach(requireFile);

const project = exists("project.godot") ? read("project.godot") : "";
if (!project.includes('config/name="Tercio: Sangre y Acero"')) {
  failures.push("project.godot does not use new title");
}
for (const autoload of [
  "SoldierManager",
  "EquipmentManager",
  "TrainingManager",
  "MissionManager",
  "CombatResolver",
  "ReportGenerator",
]) {
  if (!project.includes(`${autoload}=`)) failures.push(`missing autoload ${autoload}`);
}

const requiredData = [
  "items",
  "ranks",
  "stats",
  "training",
  "missions",
  "enemies",
  "wounds",
  "shops",
  "loot_tables",
  "report_fragments",
  "events",
];
for (const name of requiredData) {
  const data = json(`data/${name}.json`);
  if (!Array.isArray(data)) failures.push(`data/${name}.json root must be array`);
}

const items = json("data/items.json") || [];
for (const itemId of ["rusty_pike", "chipped_sword", "dented_cuirass", "clean_bandage"]) {
  if (!items.some((item) => item.id === itemId)) failures.push(`missing item ${itemId}`);
}

const missions = json("data/missions.json") || [];
if (!missions.some((mission) => mission.id === "night_watch_rain")) {
  failures.push("missing sample mission night_watch_rain");
}

const gameState = exists("scripts/core/GameState.gd") ? read("scripts/core/GameState.gd") : "";
for (const token of ["coins", "honor", "xp", "fatigue", "rank_id"]) {
  if (!gameState.includes(token)) failures.push(`GameState missing ${token}`);
}

const soldierManager = exists("scripts/managers/SoldierManager.gd") ? read("scripts/managers/SoldierManager.gd") : "";
for (const fn of ["get_soldier", "add_xp", "add_honor", "add_fatigue", "add_stat", "can_pay_training", "apply_wound"]) {
  if (!soldierManager.includes(`func ${fn}`)) failures.push(`SoldierManager missing ${fn}`);
}

const allFiles = [];
function walk(relDir) {
  for (const entry of fs.readdirSync(path.join(root, relDir), { withFileTypes: true })) {
    const relPath = path.join(relDir, entry.name).replaceAll("\\", "/");
    if (entry.isDirectory()) walk(relPath);
    else allFiles.push(relPath);
  }
}
for (const dir of ["scripts", "scenes"]) {
  if (exists(dir)) walk(dir);
}
for (const relPath of allFiles.filter((file) => file.endsWith(".gd") || file.endsWith(".tscn"))) {
  const text = read(relPath);
  for (const match of text.matchAll(/res:\/\/([^"')\]\s]+)/g)) {
    if (!exists(match[1])) failures.push(`${relPath} references missing res://${match[1]}`);
  }
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checkedFiles: allFiles.length }, null, 2));
