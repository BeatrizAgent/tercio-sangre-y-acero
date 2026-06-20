import { churchShopItems, items, shopItems } from "../../data/seed-items";
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
  MissionCombatSpriteSet,
  MissionDefinition,
  FormationSlot,
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
export const churchInventory = churchShopItems;
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

const getAssetDimensionsById = (assetId: string): [number, number] => {
  return assetDefinitions.find((asset) => asset.id === assetId)?.dimensions ?? [1024, 1536];
};

const missionSpriteFrame = (assetId: string, row: number, rowCount: number, fps: number) => {
  const [width, height] = getAssetDimensionsById(assetId);
  return {
    assetId,
    frameWidth: width / 3,
    frameHeight: height / rowCount,
    frames: 3,
    fps,
    row,
  };
};

function missionSpriteSet(id: string, name: string, role: MissionCombatSpriteSet["role"]): MissionCombatSpriteSet {
  const rowCount = role === "boss" ? 2 : 4;
  return {
    id,
    name,
    role,
    frames: {
      idle: missionSpriteFrame(id, 0, rowCount, 4),
      walk: missionSpriteFrame(id, role === "boss" ? 1 : 1, rowCount, 7),
      attack: missionSpriteFrame(id, role === "boss" ? 1 : 2, rowCount, 6),
      hurt: missionSpriteFrame(id, role === "boss" ? 1 : 3, rowCount, 5),
    },
  };
}

export const missionCombatSpriteSets: MissionCombatSpriteSet[] = [
  missionSpriteSet("team_pikeman", "Piquero", "team"),
  missionSpriteSet("team_arquebusier", "Tirador", "team"),
  missionSpriteSet("team_assistant", "Asistente", "team"),
  missionSpriteSet("team_rodelero", "Rodelero", "team"),
  missionSpriteSet("team_gastador", "Gastador", "team"),
  missionSpriteSet("minion_pike", "Esbirro con pica", "minion"),
  missionSpriteSet("minion_sword", "Esbirro con espada", "minion"),
  missionSpriteSet("minion_arquebus", "Esbirro arcabucero", "minion"),
  missionSpriteSet("enemy_boss_backline", "Jefe de retaguardia", "boss"),
];

export const missionTeamSpriteByRole: Record<string, string> = {
  piquero: "team_pikeman",
  tirador: "team_arquebusier",
  asistente: "team_assistant",
  jinete: "team_rodelero",
  gastador: "team_gastador",
};

export const missionTeamSpriteByStat: Partial<Record<StatId, string>> = {
  pike: "team_pikeman",
  sword: "team_rodelero",
  arquebus: "team_arquebusier",
  discipline: "team_gastador",
  vigor: "team_gastador",
};

export function getMissionCombatSpriteSet(spriteSetId: string | undefined) {
  if (!spriteSetId) return undefined;
  return missionCombatSpriteSets.find((spriteSet) => spriteSet.id === spriteSetId);
}

export function getMissionCombatSpritePath(spriteSetId: string | undefined) {
  const spriteSet = getMissionCombatSpriteSet(spriteSetId);
  return getAssetPathById(spriteSet?.frames.idle.assetId);
}

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
  return getAssetPathById(mission?.sceneAssetId) ?? "/assets/gpt-bank/scenes/events/night_watch_rain_bg.png";
}

export const featuredAssetPaths = {
  city: assetPath("scenes/events/pay_mutiny_bg.png"),
  barracks: assetPath("scenes/events/barracks_bg.png"),
  armory: assetPath("scenes/events/armory_bg.png"),
  hospital: assetPath("scenes/events/hospital_bg.png"),
  hospitalFieldWard: assetPath("scenes/events/hospital_field_ward_bg.png"),
  hospitalTreatment: assetPath("scenes/events/hospital_bandage_treatment.png"),
  hospitalRecoveryCot: assetPath("scenes/events/hospital_recovery_cot.png"),
  training: assetPath("scenes/events/training_yard_bg.png"),
  missionSelect: assetPath("scenes/events/mission_select_bg.png"),
  church: assetPath("scenes/events/church_interior_bg.png"),
  soldierProfile: assetPath("scenes/events/soldier_profile_bg.png"),
  diegoPortrait: assetPath("characters/diego/portraits/diego_retrato_serio.png"),
  diegoDeArcePortrait: assetPath("portraits/npcs/diego_de_arce_portrait.png"),
  diegoFullBody: assetPath("characters/diego/diego_piquero_frontal_descanso.png"),
  diegoReady: assetPath("characters/diego/diego_piquero_tres_cuartos.png"),
  diegoKneeling: assetPath("characters/diego/diego_arrodillado_con_pica.png"),
  diegoSpriteWalk: assetPath("characters/diego/sprites/diego_sprite_caminar.png"),
  armorerPortrait: assetPath("portraits/npcs/armorer_portrait.png"),
  fieldSurgeonPortrait: assetPath("portraits/npcs/field_surgeon_portrait.png"),
  sergeantPortrait: assetPath("portraits/npcs/sergeant_instructor_portrait.png"),
  campaignColumn: assetPath("scenes/events/muddy_road_patrol_bg.png"),
  campaignMap: assetPath("scenes/events/campaign_map_flanders.png"),
  woundCare: assetPath("scenes/events/wound_aftercare_blurred.png"),
  officerSupplies: assetPath("scenes/events/powder_escort_front_bg.png"),
  tavernTable: assetPath("scenes/events/tavern_duel_bg.png"),
  barracksDice: assetPath("scenes/events/pay_mutiny_bg.png"),
} as const;

export const uiIconPaths = {
  city: assetPath("ui/icons/campaign_node_city.png"),
  cityBlacksmith: assetPath("ui/icons/morion_peto_martillo.png"),
  cityShop: assetPath("ui/icons/saquito_monedas_documento.png"),
  cityTavern: assetPath("ui/icons/botella_vidrio_verde.png"),
  cityChurch: assetPath("ui/icons/medalla_cruz_roja_bronce.png"),
  churchBlessing: assetPath("ui/icons/icono_santos_devocion.png"),
  churchAmulet: assetPath("ui/icons/medalla_cruz_roja_bronce.png"),
  churchErrand: assetPath("ui/icons/sello_lacre_cruz_roja.png"),
  cityHouseOfTrade: assetPath("ui/icons/reloj_arena_bronce.png"),
  arena: assetPath("ui/icons/espada_martillo_cruzados.png"),
  barracks: assetPath("ui/icons/camastro_manta_lana.png"),
  soldier: assetPath("ui/icons/peto_morion_dorado.png"),
  training: assetPath("ui/icons/espada_martillo_yunque.png"),
  equipment: assetPath("ui/icons/morion_peto_correas.png"),
  armory: assetPath("ui/icons/morion_peto_martillo.png"),
  missions: assetPath("ui/icons/estandarte_cruz_roja_colgante.png"),
  longMissions: assetPath("ui/icons/icono_misiones_largas.png"),
  objectives: assetPath("ui/icons/icono_objetivos.png"),
  saintsDevotion: assetPath("ui/icons/icono_santos_devocion.png"),
  chestChamber: assetPath("ui/icons/icono_camara_cofres.png"),
  hospital: assetPath("ui/icons/vendas_tarros_medicina.png"),
  hospitalBandages: assetPath("ui/icons/hospital_linen_bandages.png"),
  hospitalWineSkin: assetPath("ui/icons/hospital_wine_skin.png"),
  rank: assetPath("ui/icons/medalla_cruz_roja_bronce.png"),
  coins: assetPath("ui/icons/bolsa_monedas_cruz.png"),
  honor: assetPath("ui/icons/condecoracion_estrella_laurel.png"),
  xp: assetPath("ui/icons/sol_dorado_cara.png"),
  fatigue: assetPath("ui/icons/reloj_arena_bronce.png"),
  inventory: assetPath("ui/icons/saquito_monedas_documento.png"),
  mailbox: assetPath("ui/icons/sello_lacre_cruz_roja.png"),
  battleReports: assetPath("ui/icons/pergamino_pluma_sello.png"),
  news: assetPath("ui/icons/orden_sellada_daga.png"),
  packages: assetPath("ui/icons/saquito_monedas_documento.png"),
  confirm: assetPath("ui/icons/sello_lacre_cruz_roja.png"),
  settings: assetPath("ui/icons/flecha_circular_laurel.png"),
  info: assetPath("ui/icons/pergamino_pluma_sello.png"),
  order: assetPath("ui/icons/orden_sellada_daga.png"),
  wound: assetPath("ui/icons/venda_lino_enrollada.png"),
  risk: assetPath("ui/icons/medallon_calavera_oscuro.png"),
  mud: assetPath("ui/icons/salpicadura_barro_transparente.png"),
  shield: assetPath("ui/icons/escudo_partido_cruz_roja.png"),
} as const;

export const campaignNodeIconPaths: Record<MissionDefinition["locationType"], string> = {
  battle: assetPath("ui/icons/campaign_node_battle.png"),
  city: assetPath("ui/icons/campaign_node_city.png"),
  fortress: assetPath("ui/icons/campaign_node_fortress.png"),
  road: assetPath("ui/icons/campaign_node_road.png"),
  skirmish: assetPath("ui/icons/campaign_node_skirmish.png"),
};

export const reportAssetPaths = {
  waxSeal: assetPath("ui/icons/sello_lacre_cruz_roja.png"),
  waxSealBroken: assetPath("ui/icons/medallon_calavera_oscuro.png"),
  scrollQuill: assetPath("ui/icons/pergamino_pluma_sello.png"),
  scrollDivider: assetPath("ui/icons/divisor_dorado_horizontal.png"),
  cornerTopLeft: assetPath("ui/icons/esquina_marco_dorada_superior_izquierda.png"),
  cornerTopRight: assetPath("ui/icons/esquina_marco_dorada_superior_derecha.png"),
  cornerBottomLeft: assetPath("ui/icons/esquina_marco_dorada_inferior_izquierda.png"),
  cornerBottomRight: assetPath("ui/icons/esquina_marco_dorada_inferior_derecha.png"),
  framePanelRivets: assetPath("ui/icons/marco_panel_negro_claveteado.png"),
  framePanelTall: assetPath("ui/icons/marco_panel_vertical_negro.png"),
  rewardCoinBag: assetPath("ui/icons/bolsa_monedas_cruz.png"),
  rewardCoinBagSmall: assetPath("ui/icons/bolsa_monedas_pequena.png"),
  rewardCoinHelmet: assetPath("ui/icons/casco_cuero_monedas.png"),
  rewardSun: assetPath("ui/icons/sol_dorado_cara.png"),
  rewardMedal: assetPath("ui/icons/medalla_cruz_roja_bronce.png"),
  rewardHonor: assetPath("ui/icons/condecoracion_estrella_laurel.png"),
  rewardHourglass: assetPath("ui/icons/reloj_arena_bronce.png"),
  rewardSwordHammer: assetPath("ui/icons/espada_martillo_cruzados.png"),
  banner: assetPath("ui/icons/estandarte_cruz_roja_colgante.png"),
  bottlePoison: assetPath("ui/icons/botella_vidrio_verde.png"),
  woundCare: assetPath("ui/icons/vendas_tarros_medicina.png"),
  smoke: assetPath("ui/icons/humo_negro_transparente.png"),
  mudSplatter: assetPath("ui/icons/salpicadura_barro_transparente.png"),
  ornament: assetPath("ui/icons/ornamento_dorado_horizontal.png"),
  bag: assetPath("ui/icons/saquito_monedas_documento.png"),
  skull: assetPath("ui/icons/calavera_medallon.png"),
  skullDark: assetPath("ui/icons/medallon_calavera_oscuro.png"),
  crossSwordHammer: assetPath("ui/icons/espada_martillo_yunque.png"),
} as const;

export const trainingAssetPaths: Record<StatId, string> = {
  pike: assetPath("ui/training/training_pike.png"),
  sword: assetPath("ui/training/training_sword.png"),
  arquebus: assetPath("ui/training/training_arquebus.png"),
  discipline: assetPath("ui/training/training_discipline.png"),
  vigor: assetPath("ui/training/training_vigor.png"),
  cunning: assetPath("ui/icons/pergamino_pluma_sello.png"),
  command: assetPath("ui/icons/estandarte_cruz_roja_colgante.png"),
};

export const formationRoleIconPaths: Record<FormationSlot, string> = {
  vanguardia: assetPath("ui/roles/role_vanguardia.png"),
  fuego: assetPath("ui/roles/role_fuego.png"),
  apoyo: assetPath("ui/roles/role_apoyo.png"),
  retaguardia: assetPath("ui/roles/role_retaguardia.png"),
  banquillo: assetPath("ui/roles/role_banquillo.png"),
};

export const tercioOrdinanceIconPaths = {
  cuadro_de_picas: assetPath("ui/ordinances/ordinance_cuadro_de_picas.png"),
  manga_de_fuego: assetPath("ui/ordinances/ordinance_manga_de_fuego.png"),
  escuadron_defensivo: assetPath("ui/ordinances/ordinance_escuadron_defensivo.png"),
  avance_de_socorro: assetPath("ui/ordinances/ordinance_avance_de_socorro.png"),
  escolta_del_estandarte: assetPath("ui/ordinances/ordinance_escolta_del_estandarte.png"),
  emboscada_de_arcabuces: assetPath("ui/ordinances/ordinance_emboscada_de_arcabuces.png"),
  columna_de_marcha: assetPath("ui/ordinances/ordinance_columna_de_marcha.png"),
  guardia_de_bagajes: assetPath("ui/ordinances/ordinance_guardia_de_bagajes.png"),
  asalto_de_brecha: assetPath("ui/ordinances/ordinance_asalto_de_brecha.png"),
  reserva_cerrada: assetPath("ui/ordinances/ordinance_reserva_cerrada.png"),
} as const;

export const churchBlessings = [
  {
    id: "misa_de_marcha",
    name: "Misa de marcha",
    cost: 8,
    effects: { honor: 1, fatigue: -4 },
    description: "Pan negro, cirio corto y una hora de quietud antes de salir al barro.",
  },
  {
    id: "confesion_de_campana",
    name: "Confesion de campana",
    cost: 12,
    effects: { corruption: -8, reputation: 1 },
    description: "El capellan escucha saqueos, deudas y miedo. No absuelve gratis.",
  },
  {
    id: "bendicion_del_estandarte",
    name: "Bendicion del estandarte",
    cost: 20,
    effects: { honor: 2, fatigue: -2, reputation: 1 },
    description: "Cruz sobre paño mojado. La tropa mira el asta y calla un momento.",
  },
] as const;

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
