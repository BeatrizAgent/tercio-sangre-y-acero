#!/usr/bin/env node
// build_player_portraits.mjs — regenera data/player-portraits.json a partir
// de data/catalog.json. Lee los assets con usage "player_portrait_selection"
// cuyo id empieza por "player_portrait_option_" (excluye los duplicados
// con prefijo "role_*_option_*" para evitar retratos repetidos).
//
// Uso:
//   node scripts/build_player_portraits.mjs
//
// No commitea. Imprime a stdout si --stdout, escribe a
// data/player-portraits.json por defecto.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDataDir = path.resolve(__dirname, "..", "data");
const catalogPath = path.join(rootDataDir, "catalog.json");
const targetPath = path.join(rootDataDir, "player-portraits.json");

// Mapa del sufijo del id a { displayName, role, roleLabel }.
// Mismo orden que data/player-portraits.json, asi si se anaden retratos
// nuevos solo se reordena este array.
const KNOWN_OPTIONS = [
  { suffix: "01_bisono_recruit", displayName: "Bisono", role: "recruit", roleLabel: "Recluta" },
  { suffix: "02_pike_veteran", displayName: "Piquero veterano", role: "pikeman", roleLabel: "Piquero" },
  { suffix: "03_sword_buckler_soldier", displayName: "Espadachin con broquel", role: "swordsman", roleLabel: "Espadachin" },
  { suffix: "04_arquebusier", displayName: "Arcabucero", role: "arquebusier", roleLabel: "Arcabucero" },
  { suffix: "05_old_sergeant", displayName: "Sargento viejo", role: "officer", roleLabel: "Oficial" },
  { suffix: "06_noble_alferez", displayName: "Alferez noble", role: "officer", roleLabel: "Oficial" },
  { suffix: "07_camp_guard", displayName: "Guardia del campo", role: "guard", roleLabel: "Guardia" },
  { suffix: "08_siege_survivor", displayName: "Superviviente del asedio", role: "veteran", roleLabel: "Veterano" },
  { suffix: "09_surgeon_soldier", displayName: "Cirujano soldado", role: "specialist", roleLabel: "Especialista" },
  { suffix: "10_farmhand_pikeman", displayName: "Piquero labriego", role: "pikeman", roleLabel: "Piquero" },
  { suffix: "11_artillery_assistant", displayName: "Ayudante de artilleria", role: "specialist", roleLabel: "Especialista" },
  { suffix: "12_standard_guard", displayName: "Guardia del estandarte", role: "guard", roleLabel: "Guardia" },
  { suffix: "13_hooded_scout", displayName: "Explorador encapuchado", role: "scout", roleLabel: "Explorador" },
  { suffix: "14_red_haired_recruit", displayName: "Recluta pelirrojo", role: "recruit", roleLabel: "Recluta" },
  { suffix: "15_sailor_soldier", displayName: "Soldado marinero", role: "sailor", roleLabel: "Marinero" },
  { suffix: "16_eyepatch_veteran", displayName: "Veterano del parche", role: "veteran", roleLabel: "Veterano" },
];

function knownMetaFor(id) {
  if (!id.startsWith("player_portrait_option_")) return null;
  const suffix = id.slice("player_portrait_option_".length);
  return KNOWN_OPTIONS.find((option) => option.suffix === suffix) ?? null;
}

async function main() {
  const stdout = process.argv.includes("--stdout");
  const raw = await fs.readFile(catalogPath, "utf8");
  const catalog = JSON.parse(raw);
  const options = [];

  for (const asset of catalog.assets ?? []) {
    if (!asset.usage?.includes("player_portrait_selection")) continue;
    if (!asset.id.startsWith("player_portrait_option_")) continue;
    const meta = knownMetaFor(asset.id);
    if (!meta) {
      console.warn(
        `  ! asset ${asset.id} no esta en KNOWN_OPTIONS; anadelo al script para que se incluya.`,
      );
      continue;
    }
    options.push({
      id: asset.id,
      displayName: meta.displayName,
      role: meta.role,
      roleLabel: meta.roleLabel,
      publicPath: asset.publicPath,
      width: asset.width,
      height: asset.height,
    });
  }

  if (options.length === 0) {
    throw new Error("No se encontraron retratos con usage 'player_portrait_selection' en el catalog.");
  }

  const payload = {
    version: 1,
    description:
      "Lista curada de retratos seleccionables en el creador de personaje de /login. Derivada de data/catalog.json (assets con usage 'player_portrait_selection'). Mantener sincronizada con el catalog: regenerar via scripts/build_player_portraits.mjs cuando se anadan retratos nuevos.",
    options,
  };

  const serialized = `${JSON.stringify(payload, null, 2)}\n`;
  if (stdout) {
    process.stdout.write(serialized);
    return;
  }
  await fs.writeFile(targetPath, serialized, "utf8");
  console.log(`Wrote ${options.length} portrait options to ${targetPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
