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
export type Effects = Partial<Record<StatId | "honor" | "fatigue" | "woundTreatment", number>>;

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
  value: number;
  effects: Effects;
  description: string;
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
}

export type Equipment = Record<EquipmentSlot, string | null>;

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

export interface GameState {
  soldier: Soldier;
  reports: MissionResult[];
  activeEvent: GameEvent | null;
  pendingMissionId: string | null;
}
