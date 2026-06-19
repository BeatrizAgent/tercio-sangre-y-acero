import { items, shopItems } from "../../data/seed-items";
import { enemies, lootTables, missions } from "../../data/seed-missions";
import { ranks } from "../../data/seed-ranks";
import { reportFragments } from "../../data/seed-report-fragments";
import { wounds } from "../../data/seed-wounds";
import { events } from "../../data/seed-events";
import assetsJson from "../../data/json/assets.json";
import charactersJson from "../../data/json/characters.json";
import type {
  ArenaOpponent,
  AssetDefinition,
  CharacterDefinition,
  CharacterState,
  ItemDefinition,
  ItemFootprint,
  MissionDefinition,
  SpriteSetDefinition,
  StatId,
} from "./types";

export const assetDefinitions = assetsJson as AssetDefinition[];
export const characterDefinitions = charactersJson as CharacterDefinition[];
export const itemDefinitions = items satisfies readonly ItemDefinition[];
export const missionDefinitions: MissionDefinition[] = missions.map((mission) => ({
  ...mission,
  rewards: { ...mission.rewards },
  reportTags: [...mission.reportTags],
}));
export const shopInventory = shopItems;
export const enemyDefinitions = enemies;
export interface LootDrop {
  itemId: string;
  quantity: number;
  weight?: number;
}
export interface LootTable {
  id: string;
  description?: string;
  drops: LootDrop[];
}
export const lootTableDefinitions: LootTable[] = lootTables as LootTable[];
export const rankDefinitions = ranks;
export const reportFragmentDefinitions = reportFragments;
export const woundDefinitions = wounds;
export const eventDefinitions = events;

export const spriteSetDefinitions: SpriteSetDefinition[] = [
  {
    id: "diego_pike",
    name: "Diego con pica",
    frames: {
      walk: {
        assetId: "diego_sprite_caminar",
        frameWidth: 2031 / 3,
        frameHeight: 714,
        frames: 3,
        fps: 6,
      },
      pikeAttack: {
        assetId: "diego_sprite_ataque_pica",
        frameWidth: 2076 / 3,
        frameHeight: 570,
        frames: 3,
        fps: 5,
      },
      swordAttack: {
        assetId: "diego_sprite_golpe_espada",
        frameWidth: 2141 / 3,
        frameHeight: 642,
        frames: 3,
        fps: 5,
      },
    },
  },
];

export function createCharacterStates(): CharacterState[] {
  return characterDefinitions.map((character) => ({
    ...character,
    stats: { ...character.stats },
    equipment: { ...character.equipment },
    unlocked: true,
  }));
}

export function getCharacterDefinition(characterId: string | undefined) {
  if (!characterId) return undefined;
  return characterDefinitions.find((character) => character.id === characterId);
}

export function getSpriteSetDefinition(spriteSetId: string | undefined) {
  if (!spriteSetId) return undefined;
  return spriteSetDefinitions.find((spriteSet) => spriteSet.id === spriteSetId);
}

export const arenaOpponents: ArenaOpponent[] = [
  {
    id: "jaime_el_cojo",
    name: "Jaime el Cojo",
    rank: "maton de taberna",
    portraitAssetId: "portrait_enemy_road_raider",
    power: 7,
    fatigue: 8,
    woundChance: 12,
    rewards: { coins: 7, xp: 6, honor: 1 },
    style: "Daga baja, hombro sucio, golpe rapido.",
    description: "Un veterano torcido por vino barato y deudas viejas.",
  },
  {
    id: "bruno_de_namur",
    name: "Bruno de Namur",
    rank: "piquero despedido",
    portraitAssetId: "portrait_enemy_deserter",
    power: 11,
    fatigue: 12,
    woundChance: 20,
    rewards: { coins: 12, xp: 10, honor: 2 },
    style: "Pica corta y empujones contra la empalizada.",
    description: "Sabe formar, sabe caer, y sabe morder cuando pierde.",
  },
  {
    id: "capitan_rojas",
    name: "Capitan Rojas",
    rank: "oficial retirado",
    portraitAssetId: "portrait_enemy_skirmisher",
    power: 16,
    fatigue: 16,
    woundChance: 28,
    rewards: { coins: 20, xp: 16, honor: 4 },
    style: "Ropera precisa, calma de verdugo, mirada seca.",
    description: "Un noble arruinado que vende duelos como otros venden pan.",
  },
];

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

export function getEnemy(enemyId: string | undefined) {
  if (!enemyId) return undefined;
  return enemyDefinitions.find((enemy) => enemy.id === enemyId);
}

export function getEnemySpriteImagePath(enemyId: string | undefined): string | undefined {
  const enemy = getEnemy(enemyId);
  return getAssetPathById(enemy?.portraitAssetId);
}

export function getMissionSceneImagePath(missionId: string | undefined): string {
  const mission = missionId ? getMission(missionId) : undefined;
  return getAssetPathById(mission?.sceneAssetId) ?? "/assets/gpt-bank/CG/cg_events/night_watch_rain_bg.png";
}

export const featuredAssetPaths = {
  city: assetPath("CG/cg_events/pay_mutiny_bg.png"),
  barracks: assetPath("CG/cg_events/barracks_bg.png"),
  armory: assetPath("CG/cg_events/armory_bg.png"),
  hospital: assetPath("CG/cg_events/hospital_bg.png"),
  training: assetPath("CG/cg_events/training_yard_bg.png"),
  missionSelect: assetPath("CG/cg_events/mission_select_bg.png"),
  soldierProfile: assetPath("CG/cg_events/soldier_profile_bg.png"),
  diegoPortrait: assetPath("prota/emociones/diego_retrato_serio.png"),
  diegoDeArcePortrait: assetPath("CG/portraits/diego_de_arce_portrait.png"),
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
  city: assetPath("icons-ui/campaign_node_city.png"),
  cityBlacksmith: assetPath("icons-ui/morion_peto_martillo.png"),
  cityShop: assetPath("icons-ui/saquito_monedas_documento.png"),
  cityTavern: assetPath("icons-ui/botella_vidrio_verde.png"),
  cityChurch: assetPath("icons-ui/medalla_cruz_roja_bronce.png"),
  cityHouseOfTrade: assetPath("icons-ui/reloj_arena_bronce.png"),
  arena: assetPath("icons-ui/espada_martillo_cruzados.png"),
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
  mailbox: assetPath("icons-ui/sello_lacre_cruz_roja.png"),
  battleReports: assetPath("icons-ui/pergamino_pluma_sello.png"),
  news: assetPath("icons-ui/orden_sellada_daga.png"),
  packages: assetPath("icons-ui/saquito_monedas_documento.png"),
  confirm: assetPath("icons-ui/sello_lacre_cruz_roja.png"),
  settings: assetPath("icons-ui/flecha_circular_laurel.png"),
  info: assetPath("icons-ui/pergamino_pluma_sello.png"),
  order: assetPath("icons-ui/orden_sellada_daga.png"),
  wound: assetPath("icons-ui/venda_lino_enrollada.png"),
  risk: assetPath("icons-ui/medallon_calavera_oscuro.png"),
  mud: assetPath("icons-ui/salpicadura_barro_transparente.png"),
  shield: assetPath("icons-ui/escudo_partido_cruz_roja.png"),
} as const;

export const campaignNodeIconPaths: Record<MissionDefinition["locationType"], string> = {
  battle: assetPath("icons-ui/campaign_node_battle.png"),
  city: assetPath("icons-ui/campaign_node_city.png"),
  fortress: assetPath("icons-ui/campaign_node_fortress.png"),
  road: assetPath("icons-ui/campaign_node_road.png"),
  skirmish: assetPath("icons-ui/campaign_node_skirmish.png"),
};

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

export function getItemFootprint(item: ItemDefinition | undefined): ItemFootprint {
  const footprint = item?.footprint;
  if (
    footprint &&
    Number.isInteger(footprint.cols) &&
    Number.isInteger(footprint.rows) &&
    footprint.cols > 0 &&
    footprint.rows > 0
  ) {
    return footprint;
  }
  return { cols: 1, rows: 1 };
}

export function getItemImagePath(itemId: string): string {
  const item = getItem(itemId);
  const asset = assetDefinitions.find((entry) => entry.id === item?.assetId);
  if (asset) return getAssetPublicPath(asset);

  const preferredVariants: Record<string, string> = {
    cheap_morion: "v03",
    chipped_sword: "v03",
    dented_cuirass: "v03",
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

export function listArenaOpponents() {
  return arenaOpponents;
}

export function getArenaOpponent(opponentId: string) {
  return arenaOpponents.find((opponent) => opponent.id === opponentId);
}
