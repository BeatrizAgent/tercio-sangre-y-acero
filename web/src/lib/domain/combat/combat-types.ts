import type { MissionDefinition, Soldier } from "@/lib/types";

export type CombatModifier = {
  label: string;
  value: number;
};

export type CombatReward = {
  coins: number;
  honor: number;
  xp: number;
};

export type CombatWound = {
  name: string;
  severity: "leve" | "media" | "grave";
};

export type CombatScenePhase =
  | "fade-in"
  | "title"
  | "deployment"
  | "modifiers"
  | "shot"
  | "response"
  | "outcome";

export type CombatEnemy = {
  id: string;
  name: string;
  description: string;
  power: number;
  spritePath?: string;
};

export type CombatEventLogEntry = {
  id: string;
  at: number;
  phase: CombatScenePhase;
  text: string;
  tone: "neutral" | "danger" | "success" | "reward";
};

export type CombatResult = {
  success: boolean;
  roll: number;
  target: number;
  modifiers: CombatModifier[];
  rewards: CombatReward;
  wounds: CombatWound[];
  enemy: CombatEnemy;
  eventLog: CombatEventLogEntry[];
  log: string[];
};

export type CombatResolutionModalProps = {
  open: boolean;
  onClose: () => void;
  missionTitle: string;
  missionId?: string;
  result: CombatResult;
  onContinue: () => void;
};

export interface CombatPreview {
  mission: MissionDefinition;
  soldier: Soldier;
  relevantStat: "pike" | "sword" | "arquebus" | "discipline";
  statLabel: string;
  playerPower: number;
  targetPower: number;
  enemyPower: number;
}

export const mockCombatResult: CombatResult = {
  success: true,
  roll: 12,
  target: 10,
  modifiers: [
    { label: "Arcabuz", value: 1 },
    { label: "Disciplina", value: 3 },
    { label: "Vigor", value: 3 },
    { label: "Tirada determinista", value: 5 },
  ],
  rewards: {
    coins: 180,
    honor: 15,
    xp: 120,
  },
  wounds: [],
  enemy: {
    id: "enemy_skirmishers",
    name: "escaramuzadores enemigos",
    description: "Disparos dispersos y retirada rápida.",
    power: 4,
    spritePath: "/assets/gpt-bank/enemies/french/enemy_french_001.png",
  },
  eventLog: [
    { id: "mock-deploy", at: 900, phase: "deployment", text: "La lluvia arrecia sobre el camino embarrado.", tone: "neutral" },
    { id: "mock-enemy", at: 1200, phase: "deployment", text: "Escaramuzadores enemigos toman posición junto al carro.", tone: "danger" },
    { id: "mock-shot", at: 2550, phase: "shot", text: "Diego mide distancia y fuerza la acometida.", tone: "neutral" },
    { id: "mock-outcome", at: 4700, phase: "outcome", text: "La compañía sostiene el terreno y recoge el botín.", tone: "success" },
  ],
  log: [
    "La lluvia arrecia sobre el camino embarrado.",
    "Los hombres protegen la pólvora bajo lonas húmedas.",
    "Una sombra se mueve junto al carro.",
    "¡Choque de armas! Los aceros colisionan en la niebla.",
  ],
};
