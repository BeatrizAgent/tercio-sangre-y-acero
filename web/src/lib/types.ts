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

export interface ItemDefinition {
  id: string;
  name: string;
  category: string;
  slot: EquipmentSlot;
  value: number;
  effects: Effects;
  description: string;
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
  stats: Stats;
  inventory: InventoryItem[];
  equipment: Equipment;
  wounds: ActiveWound[];
}

export interface MissionDefinition {
  id: string;
  title: string;
  type: string;
  difficulty: number;
  enemyId: string;
  rewards: { coins: number; xp: number; honor: number };
  fatigue: number;
  woundChance: number;
  woundId: string;
  lootTableId: string;
  reportTags: string[];
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
}
