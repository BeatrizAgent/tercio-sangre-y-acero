export type StatId = "pike" | "sword" | "arquebus" | "discipline" | "vigor" | "cunning" | "command";

export type EquipmentSlot =
  | "head"
  | "body"
  | "mainHand"
  | "offHand"
  | "firearm"
  | "accessory"
  | "boots"
  | "consumable";

export type Stats = Record<StatId, number>;
export type Effects = Partial<Record<StatId | "honor" | "fatigue" | "woundTreatment" | "coins_pct" | "chance" | "duration", number>>;

export interface ItemFootprint {
  cols: number;
  rows: number;
}

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type PassiveTrigger =
  | "passive"
  | "on_hit"
  | "on_kill"
  | "on_wound"
  | "on_mission_start"
  | "on_mission_end"
  | "on_loot";

export interface Passive {
  id: string;
  name: string;
  description: string;
  trigger: PassiveTrigger;
  effect: Effects & { chance?: number; duration?: number };
}

export interface ItemRequirements {
  minRank?: string;
  minHonor?: number;
  minStat?: Partial<Stats>;
}

export type AssetPresentation = "normal" | "blurred" | "obscured";

export interface AssetDefinition {
  id: string;
  category: string;
  path: string;
  source: "chatgpt_manual";
  dimensions: [number, number];
  transparent: boolean;
  usage: string[];
  mature: boolean;
  presentation: AssetPresentation;
}

export interface ItemDefinition {
  id: string;
  name: string;
  category: string;
  slot: EquipmentSlot;
  footprint: ItemFootprint;
  value: number;
  effects: Effects;
  description: string;
  rarity?: Rarity;
  tier?: number;
  passives?: Passive[];
  requirements?: ItemRequirements;
  assetId?: string;
}

export interface ShopItem {
  itemId: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
  chest?: number;
  x?: number;
  y?: number;
}

export type Equipment = Record<EquipmentSlot, string | null>;

export type FormationSlot = "vanguardia" | "fuego" | "apoyo" | "retaguardia" | "banquillo";

export interface SpriteSheetRef {
  assetId: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  fps: number;
  row?: number;
}

export interface SpriteSetDefinition {
  id: string;
  name: string;
  frames: {
    walk?: SpriteSheetRef;
    pikeAttack?: SpriteSheetRef;
    swordAttack?: SpriteSheetRef;
  };
}

export interface MissionCombatSpriteSet {
  id: string;
  name: string;
  role: "team" | "minion" | "boss";
  frames: {
    idle: SpriteSheetRef;
    walk: SpriteSheetRef;
    attack: SpriteSheetRef;
    hurt: SpriteSheetRef;
  };
}

export interface CharacterDefinition {
  id: string;
  name: string;
  role: string;
  rank: string;
  portraitAssetId: string;
  tercioAssetId?: string;
  emotionAssetId?: string;
  spriteSetId?: string;
  formationSlot: FormationSlot;
  fatigue: number;
  stats: Stats;
  equipment: Equipment;
}

export interface CharacterState extends CharacterDefinition {
  unlocked: boolean;
}

export interface ActiveWound {
  id: string;
  woundId: string;
  treated: boolean;
}

export interface Soldier {
  id: string;
  name: string;
  rank: string;
  coins: number;
  honor: number;
  xp: number;
  fatigue: number;
  unpaidWages: number;
  reputation: number;
  corruption: number;
  banMissionsLeft: number;
  stats: Stats;
  inventory: InventoryItem[];
  equipment: Equipment;
  wounds: ActiveWound[];
}

export interface EventChoice {
  id: string;
  label: string;
  requirements: {
    coins?: number;
    items?: { itemId: string; quantity: number }[];
  };
  effects: {
    coins?: number;
    honor?: number;
    fatigue?: number;
    reputation?: number;
    corruption?: number;
    wound?: string;
    breakEquipment?: boolean;
    items?: { itemId: string; quantity: number }[];
  };
  result_text: string;
}

export interface GameEvent {
  id: string;
  title: string;
  text: string;
  assetId?: string;
  mature?: boolean;
  presentation?: AssetPresentation;
  choices: EventChoice[];
}

export type RegionId = "italia" | "africa" | "flandes" | "francia" | "inglaterra";

export interface MissionDefinition {
  id: string;
  title: string;
  type: string;
  difficulty: number;
  enemyId: string;
  sceneAssetId?: string;
  rewards: { coins: number; xp: number; honor: number };
  fatigue: number;
  woundChance: number;
  woundId: string;
  lootTableId: string;
  reportTags: string[];
  x: number;
  y: number;
  locationType: "road" | "city" | "fortress" | "skirmish" | "battle";
  region?: RegionId;
}

export interface MissionResult {
  id: string;
  missionId: string;
  success: boolean;
  report: string;
  rewards: { coins: number; xp: number; honor: number };
  fatigue: number;
  wounds: string[];
  loot: InventoryItem[];
  createdAt: string;
}

export interface ArenaOpponent {
  id: string;
  name: string;
  rank: string;
  portraitAssetId?: string;
  power: number;
  fatigue: number;
  woundChance: number;
  rewards: { coins: number; xp: number; honor: number };
  style: string;
  description: string;
}

export interface ArenaResult {
  id: string;
  opponentId: string;
  success: boolean;
  report: string;
  rewards: { coins: number; xp: number; honor: number };
  fatigue: number;
  wounds: string[];
  createdAt: string;
}

export interface Rank {
  id: string;
  name: string;
  minXp: number;
  minHonor: number;
}

export interface Enemy {
  id: string;
  name: string;
  power: number;
  description: string;
  portraitAssetId: string;
}

export interface WoundDefinition {
  id: string;
  name: string;
  severity: number;
  effects: Partial<Record<string, number>>;
  description: string;
  treatmentItems: string[];
}

export interface ReportFragment {
  id: string;
  type: string;
  tags: string[];
  text: string;
}

export interface BossEntry {
  id: string;
  title: string;
  type: string;
  difficulty: number;
  enemyId: string;
  portraitAssetId?: string;
  rewards: { coins: number; xp: number; honor: number };
  fatigue: number;
  woundChance: number;
  missionId?: string;
}

export interface Region {
  id: RegionId;
  name: string;
  description: string;
  x: number;
  y: number;
  bosses: BossEntry[];
}

export interface RecruitmentCost {
  coins?: number;
  honor?: number;
  reputation?: number;
}

export interface RecruitmentCandidate {
  id: string;
  hook: string;
  cost: RecruitmentCost;
  character: CharacterDefinition;
}

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

export interface GameState {
  soldier: Soldier;
  characters: CharacterState[];
  activeCharacterId: string;
  reports: MissionResult[];
  arenaResults: ArenaResult[];
  activeEvent: GameEvent | null;
  pendingMissionId: string | null;
  // Multiplayer fields: all optional so single-player state shape keeps
  // working. They are populated by lib/realtime/* when Django Channels
  // pushes updates; today they are simply undefined.
  guildMembers?: GuildMember[];
  leaderboard?: LeaderboardEntry[];
  notifications?: Notification[];
}

// ---- Multiplayer primitives (commit 5 seam) -------------------------------
//
// Three types the WebSocket layer will push. The current build never sets
// these fields; when Channels is wired up, lib/realtime/* will call
// useGameStore.getState().applyServerEvent(...) to fold a ServerEvent
// into the right slice of state.

export interface GuildMember {
  id: string;
  name: string;
  role: string;
  rank: string;
  isOnline: boolean;
  contribution: number;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  honor: number;
  reputation: number;
  guildId?: string;
}

export type NotificationKind = "report" | "wound" | "rank" | "guild" | "market" | "message";

export interface Notification {
  id: string;
  type: NotificationKind;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

// Discriminated union of every server-pushed event the client can apply.
// Add a new variant here when lib/realtime/* learns to push a new shape.
export type ServerEvent =
  | { type: "leaderboard.updated"; entries: LeaderboardEntry[] }
  | { type: "guild.member.joined"; member: GuildMember }
  | { type: "guild.member.left"; memberId: string }
  | { type: "notification.new"; notification: Notification }
  | { type: "notification.read"; notificationId: string };
