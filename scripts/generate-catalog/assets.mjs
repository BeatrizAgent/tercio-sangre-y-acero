#!/usr/bin/env node
// assets.mjs — load existing assets from the catalog + define new canonical ones.

import { makeAsset } from "./core.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function guessKind(category, usage) {
  const u = (usage ?? []).join(",").toLowerCase();
  const c = (category ?? "").toLowerCase();
  if (u.includes("portrait") || u.includes("dialogue") || c === "character" || c === "character_emotion")
    return "portrait";
  if (u.includes("scene") || c === "scene") return "scene";
  if (c === "weapon" || u.includes("armory") || u.includes("inventory")) return "item";
  if (u.includes("banner")) return "banner";
  if (u.includes("effect")) return "effect";
  if (u.includes("icon")) return "icon";
  return "item";
}

function loadExistingAssets() {
  // Read the existing assets that the catalog preserved. The generator is
  // idempotent: re-running it should not duplicate existing entries. Since
  // catalog.json is the new source of truth, we extract the assets from it
  // (when it exists) so we never lose the original GPT-ASSETS-backed entries.
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const catalogPath = path.resolve(__dirname, "..", "..", "data", "catalog.json");
  if (!fs.existsSync(catalogPath)) {
    return [];
  }
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  return (catalog.assets ?? []).map((r) => ({
    id: r.id,
    kind: r.kind,
    publicPath: r.publicPath,
    width: r.width ?? 1024,
    height: r.height ?? 1024,
    usage: r.usage ?? ["inventory"],
    mature: !!r.mature,
    presentation: r.presentation ?? (r.mature ? "blurred" : "normal"),
    prompt: r.prompt ?? `Historical SFW game asset. ${r.id.replace(/_/g, " ")}.`,
  }));
}

// 80 NEW canonical assets filling the gaps.
const NEW_ASSETS = [
  // Moriones (11)
  makeAsset("asset_morion_common_001", "item", ["item", "helmet"], "battered morion helmet, dark steel, simple comb"),
  makeAsset("asset_morion_common_002", "item", ["item", "helmet"], "morion with bronze rivets, dented brim"),
  makeAsset("asset_morion_common_003", "item", ["item", "helmet"], "rust-pitted morion, leather strap torn"),
  makeAsset("asset_morion_uncommon_001", "item", ["item", "helmet"], "polished morion with engraved comb"),
  makeAsset("asset_morion_uncommon_002", "item", ["item", "helmet"], "morion with high comb, brass studs"),
  makeAsset("asset_morion_uncommon_003", "item", ["item", "helmet"], "morion with engraved saint, mid-rank"),
  makeAsset("asset_morion_rare_001", "item", ["item", "helmet"], "fluted morion of an officer, fine steel"),
  makeAsset("asset_morion_rare_002", "item", ["item", "helmet"], "morion with raised crest, ceremonial"),
  makeAsset("asset_morion_veteran_001", "item", ["item", "helmet"], "masterwork morion, etched with cross"),
  makeAsset("asset_morion_masterwork_001", "item", ["item", "helmet"], "gilded morion of a captain, fleurs-de-lis"),
  makeAsset("asset_celada_001", "item", ["item", "helmet"], "closed burgonet with visor"),

  // Cuirasses (11)
  makeAsset("asset_cuirass_common_001", "item", ["item", "chest"], "dented cuirass, rust streaks, single rivet row"),
  makeAsset("asset_cuirass_common_002", "item", ["item", "chest"], "pitted breastplate, leather strap broken"),
  makeAsset("asset_cuirass_common_003", "item", ["item", "chest"], "worn cuirass with mud stains"),
  makeAsset("asset_cuirass_uncommon_001", "item", ["item", "chest"], "polished cuirass with tassets"),
  makeAsset("asset_cuirass_uncommon_002", "item", ["item", "chest"], "brigandine, dark steel, brass rivets"),
  makeAsset("asset_cuirass_uncommon_003", "item", ["item", "chest"], "cuirass with engraved tassets, mid-rank"),
  makeAsset("asset_cuirass_rare_001", "item", ["item", "chest"], "fluted officer cuirass, gilded edge"),
  makeAsset("asset_cuirass_rare_002", "item", ["item", "chest"], "cuirass with engraved saint"),
  makeAsset("asset_cuirass_rare_003", "item", ["item", "chest"], "cuirass with saint and tassets, officer"),
  makeAsset("asset_cuirass_veteran_001", "item", ["item", "chest"], "masterwork cuirass, hammered finish"),
  makeAsset("asset_cuirass_veteran_002", "item", ["item", "chest"], "cuirass of the Old Guard, inlaid brass"),
  makeAsset("asset_cuirass_masterwork_001", "item", ["item", "chest"], "gilded captain's cuirass, cross of Santiago"),

  // Gambesons (6)
  makeAsset("asset_gambeson_common_001", "item", ["item", "chest"], "linen gambeson, raw cream color"),
  makeAsset("asset_gambeson_common_002", "item", ["item", "chest"], "padded gambeson with mud stains"),
  makeAsset("asset_gambeson_uncommon_001", "item", ["item", "chest"], "woolen gambeson, brown, leather belt"),
  makeAsset("asset_gambeson_rare_001", "item", ["item", "chest"], "red gambeson with bronze buttons"),
  makeAsset("asset_gambeson_veteran_001", "item", ["item", "chest"], "officer's gambeson, blue with trim"),
  makeAsset("asset_gambeson_masterwork_001", "item", ["item", "chest"], "captain's gambeson, embroidered"),

  // Boots (6)
  makeAsset("asset_boots_common_001", "item", ["item", "boots"], "worn leather boots, mud-caked"),
  makeAsset("asset_boots_common_002", "item", ["item", "boots"], "cracked boots, broken buckle"),
  makeAsset("asset_boots_uncommon_001", "item", ["item", "boots"], "tall leather boots, officer style"),
  makeAsset("asset_boots_rare_001", "item", ["item", "boots"], "polished riding boots, brass buckles"),
  makeAsset("asset_boots_veteran_001", "item", ["item", "boots"], "reinforced cavalry boots"),
  makeAsset("asset_boots_masterwork_001", "item", ["item", "boots"], "engraved boots of a captain"),

  // Gloves (4)
  makeAsset("asset_gloves_common_001", "item", ["item", "gloves"], "worn leather gloves, bloodstained"),
  makeAsset("asset_gloves_uncommon_001", "item", ["item", "gloves"], "buff coat gloves, riveted"),
  makeAsset("asset_gloves_rare_001", "item", ["item", "gloves"], "gauntlets with steel fingers"),
  makeAsset("asset_gloves_veteran_001", "item", ["item", "gloves"], "officer's gauntlets, etched"),

  // Pikes (8)
  makeAsset("asset_pike_common_001", "item", ["item", "weapon"], "crude wooden pike, poorly tempered tip"),
  makeAsset("asset_pike_common_002", "item", ["item", "weapon"], "short pike of ash, blunt"),
  makeAsset("asset_pike_uncommon_001", "item", ["item", "weapon"], "ash pike with iron shoe"),
  makeAsset("asset_pike_uncommon_002", "item", ["item", "weapon"], "long pike, beech shaft, fair tip"),
  makeAsset("asset_pike_rare_001", "item", ["item", "weapon"], "officer's pike, balanced, with banner"),
  makeAsset("asset_pike_rare_002", "item", ["item", "weapon"], "flanders pike, fine steel head"),
  makeAsset("asset_pike_veteran_001", "item", ["item", "weapon"], "masterwork pike, signed by armero"),
  makeAsset("asset_pike_masterwork_001", "item", ["item", "weapon"], "pike of the captain, gilded ferrule"),

  // Swords (8)
  makeAsset("asset_sword_common_001", "item", ["item", "weapon"], "rusty side sword, dull edge"),
  makeAsset("asset_sword_common_002", "item", ["item", "weapon"], "cheap dagger, leather grip"),
  makeAsset("asset_sword_uncommon_001", "item", ["item", "weapon"], "cup-hilted rapier, Toledo"),
  makeAsset("asset_sword_uncommon_002", "item", ["item", "weapon"], "broad sword of Flanders"),
  makeAsset("asset_sword_rare_001", "item", ["item", "weapon"], "officer's sword, curved quillons"),
  makeAsset("asset_sword_rare_002", "item", ["item", "weapon"], "Toledo steel broadsword, engraved"),
  makeAsset("asset_sword_veteran_001", "item", ["item", "weapon"], "named sword, leather scabbard"),
  makeAsset("asset_sword_masterwork_001", "item", ["item", "weapon"], "Tizona of the company, gilded"),

  // Arquebuses (8)
  makeAsset("asset_arquebus_common_001", "item", ["item", "weapon"], "worn arquebus, slow matchlock"),
  makeAsset("asset_arquebus_common_002", "item", ["item", "weapon"], "rusty musket, cracked stock"),
  makeAsset("asset_arquebus_uncommon_001", "item", ["item", "weapon"], "matchlock arquebus, greased lock"),
  makeAsset("asset_arquebus_uncommon_002", "item", ["item", "weapon"], "arquebus with short rest"),
  makeAsset("asset_arquebus_rare_001", "item", ["item", "weapon"], "wheel-lock musket, walnut stock"),
  makeAsset("asset_arquebus_rare_002", "item", ["item", "weapon"], "flintlock, iron sights"),
  makeAsset("asset_arquebus_veteran_001", "item", ["item", "weapon"], "masterwork flintlock, walnut"),
  makeAsset("asset_arquebus_masterwork_001", "item", ["item", "weapon"], "officer's musket, inlaid brass"),

  // Consumables (8)
  makeAsset("asset_consumable_bread_001", "item", ["item", "consumable"], "hardtack bread, stale, on cloth"),
  makeAsset("asset_consumable_wine_001", "item", ["item", "consumable"], "leather wineskin, dark wine"),
  makeAsset("asset_consumable_bandage_001", "item", ["item", "consumable"], "linen bandages, rolled"),
  makeAsset("asset_consumable_ointment_001", "item", ["item", "consumable"], "small jar of soldier's ointment"),
  makeAsset("asset_consumable_powder_001", "item", ["item", "consumable"], "leather pouch of gunpowder"),
  makeAsset("asset_consumable_lead_001", "item", ["item", "consumable"], "lead musket balls, in pouch"),
  makeAsset("asset_consumable_match_001", "item", ["item", "consumable"], "coil of slow match cord"),
  makeAsset("asset_consumable_needle_001", "item", ["item", "consumable"], "bone needle with thread"),

  // Materials (6)
  makeAsset("asset_material_cloth_001", "item", ["item", "material"], "dirty linen scrap"),
  makeAsset("asset_material_buckle_001", "item", ["item", "material"], "brass buckle, broken"),
  makeAsset("asset_material_leather_001", "item", ["item", "material"], "hardened leather scrap"),
  makeAsset("asset_material_powder_001", "item", ["item", "material"], "damp powder, ruined"),
  makeAsset("asset_material_lead_001", "item", ["item", "material"], "melted lead slug"),
  makeAsset("asset_material_splinter_001", "item", ["item", "material"], "splintered pike shaft"),

  // Religious (4)
  makeAsset("asset_religious_rosary_001", "item", ["item", "trinket"], "wooden rosary beads"),
  makeAsset("asset_religious_relic_001", "item", ["item", "trinket"], "Santiago relic, dubious"),
  makeAsset("asset_religious_medal_001", "item", ["item", "trinket"], "brass medal of Saint James"),
  makeAsset("asset_religious_cross_001", "item", ["item", "trinket"], "iron cross, soldier's"),

  // Trinkets (3)
  makeAsset("asset_trinket_map_001", "item", ["item", "trinket"], "Flanders campaign map, stained"),
  makeAsset("asset_trinket_letter_001", "item", ["item", "trinket"], "letter from home, folded"),
  makeAsset("asset_trinket_coin_001", "item", ["item", "trinket"], "silver coin, worn"),

  // Portraits (10)
  makeAsset("asset_portrait_piquero_001", "portrait", ["portrait", "recruit"], "young pikeman recruit, weary face"),
  makeAsset("asset_portrait_arcabucero_001", "portrait", ["portrait", "recruit"], "arquebusier, scarred cheek"),
  makeAsset("asset_portrait_cirujano_001", "portrait", ["portrait", "npc"], "field surgeon, bloodied apron"),
  makeAsset("asset_portrait_capellan_001", "portrait", ["portrait", "npc"], "chaplain, rosary in hand"),
  makeAsset("asset_portrait_cabo_001", "portrait", ["portrait", "npc"], "corporal, weathered, hard eyes"),
  makeAsset("asset_portrait_sargento_001", "portrait", ["portrait", "npc"], "sergeant, old campaigner"),
  makeAsset("asset_portrait_capitan_001", "portrait", ["portrait", "npc"], "captain, well-dressed, grave"),
  makeAsset("asset_portrait_intendente_001", "portrait", ["portrait", "npc"], "quartermaster, ledger in hand"),
  makeAsset("asset_portrait_recluta_joven_001", "portrait", ["portrait", "recruit"], "very young recruit, scared eyes"),
  makeAsset("asset_portrait_veterano_001", "portrait", ["portrait", "recruit"], "veteran, missing ear, calm"),

  // Scenes (8)
  makeAsset("asset_scene_camino_barroso_001", "scene", ["mission", "road"], "muddy Castilian road, low fog, pikes"),
  makeAsset("asset_scene_campamento_001", "scene", ["mission", "camp"], "encampment at dusk, cook fires, tents"),
  makeAsset("asset_scene_patrulla_bosque_001", "scene", ["mission", "road"], "forest patrol, misty path, arquebusiers"),
  makeAsset("asset_scene_trinchera_001", "scene", ["mission", "trench"], "trench wall, mud, stacked sandbags, pike points"),
  makeAsset("asset_scene_convoy_001", "scene", ["mission", "road"], "supply convoy on a rutted road"),
  makeAsset("asset_scene_asedio_001", "scene", ["mission", "siege"], "siege line, bastion in distance, smoke"),
  makeAsset("asset_scene_escaramuza_flandes_001", "scene", ["mission", "skirmish"], "Flanders crossroads, low farms, rain"),
  makeAsset("asset_scene_escaramuza_italia_001", "scene", ["mission", "skirmish"], "Italian hill road, vineyards, hot sun"),

  // Icons (4)
  makeAsset("asset_icon_coin_001", "icon", ["ui"], "single silver coin"),
  makeAsset("asset_icon_honor_001", "icon", ["ui"], "small honor cross, brass"),
  makeAsset("asset_icon_fatigue_001", "icon", ["ui"], "tired eye, painted"),
  makeAsset("asset_icon_xp_001", "icon", ["ui"], "pike tip, painted"),

  // Trinkets (extra, 1)
  makeAsset("asset_glasses_001", "item", ["item", "trinket"], "early modern reading glasses, brass frames"),

  // Enemy (3)
  makeAsset("asset_enemy_bandolero_001", "enemy", ["enemy"], "road bandit, ragged, knife in hand"),
  makeAsset("asset_enemy_desertor_001", "enemy", ["enemy"], "deserter, hollow eyes, half-armor"),
  makeAsset("asset_enemy_oficial_001", "enemy", ["enemy"], "enemy officer, breastplate, sword"),

  // Banners (3)
  makeAsset("asset_banner_tercio_001", "banner", ["ui", "company"], "tercio banner, cross of Burgundy, weathered"),
  makeAsset("asset_banner_compania_001", "banner", ["ui", "company"], "company banner, simple red"),
  makeAsset("asset_banner_campana_001", "banner", ["ui", "campaign"], "campaign banner, golden lion"),

  // Effects (3)
  makeAsset("asset_effect_coin_rain_001", "effect", ["combat"], "coins raining, painted, semi-transparent"),
  makeAsset("asset_effect_powder_smoke_001", "effect", ["combat"], "powder smoke cloud, low"),
  makeAsset("asset_effect_blood_drop_001", "effect", ["combat", "mature"], "single dark drop, blurred for SFW", { mature: true, presentation: "blurred" }),
];

export function buildAssets() {
  const existing = loadExistingAssets();
  const seen = new Set(existing.map((a) => a.id));
  const merged = [...existing];
  for (const na of NEW_ASSETS) {
    if (seen.has(na.id)) continue;
    seen.add(na.id);
    merged.push(na);
  }
  return merged;
}
