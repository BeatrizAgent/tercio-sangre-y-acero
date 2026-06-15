import { items, shopItems } from "../../data/seed-items";
import { enemies, lootTables, missions } from "../../data/seed-missions";
import { ranks } from "../../data/seed-ranks";
import { reportFragments } from "../../data/seed-report-fragments";
import { wounds } from "../../data/seed-wounds";
import { events } from "../../data/seed-events";
import assetsJson from "../../data/json/assets.json";
import type { AssetDefinition, ItemDefinition, MissionDefinition, StatId } from "./types";

export const assetDefinitions = assetsJson as AssetDefinition[];
export const itemDefinitions = items satisfies readonly ItemDefinition[];
export const missionDefinitions: MissionDefinition[] = missions.map((mission) => ({
  ...mission,
  rewards: { ...mission.rewards },
  reportTags: [...mission.reportTags],
}));
export const shopInventory = shopItems;
export const enemyDefinitions = enemies;
export const lootTableDefinitions = lootTables;
export const rankDefinitions = ranks;
export const reportFragmentDefinitions = reportFragments;
export const woundDefinitions = wounds;
export const eventDefinitions = events;

export function getAssetPublicPath(asset: AssetDefinition): string {
  return `/${asset.path.replace(/^GPT-ASSETS\//, "assets/gpt-bank/")}`;
}

export function assetPath(path: string): string {
  return `/assets/gpt-bank/${path}`;
}

export function getAssetPathById(assetId: string | undefined): string | undefined {
  if (!assetId) return undefined;
  const asset = assetDefinitions.find((entry) => entry.id === assetId);
  return asset ? getAssetPublicPath(asset) : undefined;
}

export function getMissionSceneImagePath(missionId: string | undefined): string {
  const mission = missionId ? getMission(missionId) : undefined;
  return getAssetPathById(mission?.sceneAssetId) ?? "/assets/gpt-bank/CG/cg_events/night_watch_rain_bg.png";
}

export const featuredAssetPaths = {
  barracks: assetPath("CG/cg_events/barracks_bg.png"),
  armory: assetPath("CG/cg_events/armory_bg.png"),
  hospital: assetPath("CG/cg_events/hospital_bg.png"),
  training: assetPath("CG/cg_events/training_yard_bg.png"),
  missionSelect: assetPath("CG/cg_events/mission_select_bg.png"),
  soldierProfile: assetPath("CG/cg_events/soldier_profile_bg.png"),
  diegoPortrait: assetPath("prota/emociones/diego_retrato_serio.png"),
  diegoFullBody: assetPath("prota/diego_piquero_frontal_descanso.png"),
  diegoReady: assetPath("prota/diego_piquero_tres_cuartos.png"),
  diegoKneeling: assetPath("prota/diego_arrodillado_con_pica.png"),
  diegoSpriteWalk: assetPath("prota/sprites-animation/diego_sprite_caminar.png"),
  armorerPortrait: assetPath("CG/portraits/armorer_portrait.png"),
  fieldSurgeonPortrait: assetPath("CG/portraits/field_surgeon_portrait.png"),
  sergeantPortrait: assetPath("CG/portraits/sergeant_instructor_portrait.png"),
  campaignColumn: assetPath("CG/cg_events/muddy_road_patrol_bg.png"),
  campaignMap: assetPath("CG/cg_events/campaign_map_flanders.png"),
  woundCare: assetPath("CG/cg_events/wound_aftercare_blurred.png"),
  officerSupplies: assetPath("CG/cg_events/powder_escort_front_bg.png"),
  tavernTable: assetPath("CG/cg_events/tavern_duel_bg.png"),
  barracksDice: assetPath("CG/cg_events/pay_mutiny_bg.png"),
} as const;

export const uiIconPaths = {
  barracks: assetPath("icons-ui/camastro_manta_lana.png"),
  soldier: assetPath("icons-ui/peto_morion_dorado.png"),
  training: assetPath("icons-ui/espada_martillo_yunque.png"),
  equipment: assetPath("icons-ui/morion_peto_correas.png"),
  armory: assetPath("icons-ui/morion_peto_martillo.png"),
  missions: assetPath("icons-ui/estandarte_cruz_roja_colgante.png"),
  hospital: assetPath("icons-ui/vendas_tarros_medicina.png"),
  rank: assetPath("icons-ui/medalla_cruz_roja_bronce.png"),
  coins: assetPath("icons-ui/bolsa_monedas_cruz.png"),
  honor: assetPath("icons-ui/condecoracion_estrella_laurel.png"),
  xp: assetPath("icons-ui/sol_dorado_cara.png"),
  fatigue: assetPath("icons-ui/reloj_arena_bronce.png"),
  inventory: assetPath("icons-ui/saquito_monedas_documento.png"),
  confirm: assetPath("icons-ui/sello_lacre_cruz_roja.png"),
  settings: assetPath("icons-ui/flecha_circular_laurel.png"),
  info: assetPath("icons-ui/pergamino_pluma_sello.png"),
} as const;

export const reportAssetPaths = {
  waxSeal: assetPath("icons-ui/sello_lacre_cruz_roja.png"),
  waxSealBroken: assetPath("icons-ui/medallon_calavera_oscuro.png"),
  scrollQuill: assetPath("icons-ui/pergamino_pluma_sello.png"),
  scrollDivider: assetPath("icons-ui/divisor_dorado_horizontal.png"),
  cornerTopLeft: assetPath("icons-ui/esquina_marco_dorada_superior_izquierda.png"),
  cornerTopRight: assetPath("icons-ui/esquina_marco_dorada_superior_derecha.png"),
  cornerBottomLeft: assetPath("icons-ui/esquina_marco_dorada_inferior_izquierda.png"),
  cornerBottomRight: assetPath("icons-ui/esquina_marco_dorada_inferior_derecha.png"),
  framePanelRivets: assetPath("icons-ui/marco_panel_negro_claveteado.png"),
  framePanelTall: assetPath("icons-ui/marco_panel_vertical_negro.png"),
  rewardCoinBag: assetPath("icons-ui/bolsa_monedas_cruz.png"),
  rewardCoinBagSmall: assetPath("icons-ui/bolsa_monedas_pequena.png"),
  rewardCoinHelmet: assetPath("icons-ui/casco_cuero_monedas.png"),
  rewardSun: assetPath("icons-ui/sol_dorado_cara.png"),
  rewardMedal: assetPath("icons-ui/medalla_cruz_roja_bronce.png"),
  rewardHonor: assetPath("icons-ui/condecoracion_estrella_laurel.png"),
  rewardHourglass: assetPath("icons-ui/reloj_arena_bronce.png"),
  rewardSwordHammer: assetPath("icons-ui/espada_martillo_cruzados.png"),
  banner: assetPath("icons-ui/estandarte_cruz_roja_colgante.png"),
  bottlePoison: assetPath("icons-ui/botella_vidrio_verde.png"),
  woundCare: assetPath("icons-ui/vendas_tarros_medicina.png"),
  smoke: assetPath("icons-ui/humo_negro_transparente.png"),
  mudSplatter: assetPath("icons-ui/salpicadura_barro_transparente.png"),
  ornament: assetPath("icons-ui/ornamento_dorado_horizontal.png"),
  bag: assetPath("icons-ui/saquito_monedas_documento.png"),
  skull: assetPath("icons-ui/calavera_medallon.png"),
  skullDark: assetPath("icons-ui/medallon_calavera_oscuro.png"),
  crossSwordHammer: assetPath("icons-ui/espada_martillo_yunque.png"),
} as const;

export const trainingAssetPaths: Record<StatId, string> = {
  pike: assetPath("prota/diego_piquero_frontal_firme.png"),
  sword: assetPath("icons-ui/espada_martillo_cruzados.png"),
  arquebus: assetPath("armas/arma_021.png"),
  discipline: assetPath("CG/sprites_events/soldado_arrodillado_ante_ensenia.png"),
  vigor: assetPath("prota/diego_arrodillado_con_pica.png"),
  cunning: assetPath("icons-ui/pergamino_pluma_sello.png"),
  command: assetPath("icons-ui/estandarte_cruz_roja_colgante.png"),
};

export const trainingOptions: Array<{
  stat: StatId;
  name: string;
  cost: { coins: number; xp: number };
  gain: number;
  fatigue: number;
  description: string;
}> = [
  { stat: "pike", name: "Pike Drill", cost: { coins: 4, xp: 0 }, gain: 1, fatigue: 4, description: "Hours in formation until shoulders burn." },
  { stat: "sword", name: "Sword Yard", cost: { coins: 5, xp: 0 }, gain: 1, fatigue: 5, description: "Dull blades, bruised hands, fewer mistakes." },
  { stat: "arquebus", name: "Match and Powder", cost: { coins: 6, xp: 0 }, gain: 1, fatigue: 4, description: "Slow loading in damp air while the sergeant curses." },
  { stat: "discipline", name: "Company Discipline", cost: { coins: 3, xp: 0 }, gain: 1, fatigue: 3, description: "Stand still, move together, fear later." },
  { stat: "vigor", name: "Pack March", cost: { coins: 2, xp: 0 }, gain: 1, fatigue: 6, description: "Mud road, full pack, no complaint that helps." },
];

export function getItem(itemId: string) {
  return itemDefinitions.find((item) => item.id === itemId);
}

export function getItemImagePath(itemId: string): string {
  const item = getItem(itemId);
  const asset = assetDefinitions.find((entry) => entry.id === item?.assetId);
  if (asset) return getAssetPublicPath(asset);

  const preferredVariants: Record<string, string> = {
    cheap_morion: "v03",
    chipped_sword: "v03",
    dented_cuirass: "v03",
    rusty_pike: "v01",
    worn_arquebus: "v01",
  };

  if (itemId === "worn_arquebus") {
    return `/assets/generated/icons/arquebus_with_worn_stock_${preferredVariants[itemId]}.png`;
  }
  return `/assets/generated/icons/${itemId}_${preferredVariants[itemId] ?? "v01"}.png`;
}

export function getAsset(assetId: string) {
  return assetDefinitions.find((asset) => asset.id === assetId);
}

export function getRankName(rankId: string) {
  return rankDefinitions.find((rank) => rank.id === rankId)?.name ?? rankId;
}

export function getWound(woundId: string) {
  return woundDefinitions.find((wound) => wound.id === woundId);
}

export function getNextRank(xp: number, honor: number) {
  return [...rankDefinitions]
    .reverse()
    .find((rank) => xp >= rank.minXp && honor >= rank.minHonor);
}

export function getEquipmentBonuses(equipment: Record<string, string | null>) {
  const bonuses: Record<string, number> = {};
  for (const itemId of Object.values(equipment)) {
    if (!itemId) continue;
    const item = getItem(itemId);
    if (!item) continue;
    for (const [key, value] of Object.entries(item.effects)) {
      bonuses[key] = (bonuses[key] ?? 0) + Number(value);
    }
  }
  return bonuses;
}

export function listAvailableMissions() {
  return missionDefinitions;
}

export function getMission(missionId: string) {
  return missionDefinitions.find((mission) => mission.id === missionId);
}
