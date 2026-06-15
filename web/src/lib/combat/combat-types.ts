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

export type CombatResult = {
  success: boolean;
  roll: number;
  target: number;
  modifiers: CombatModifier[];
  rewards: CombatReward;
  wounds: CombatWound[];
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

export type CombatScenePhase =
  | "fade-in"
  | "title"
  | "deployment"
  | "modifiers"
  | "shot"
  | "response"
  | "outcome";

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
  log: [
    "La lluvia arrecia sobre el camino embarrado.",
    "Los hombres protegen la pólvora bajo lonas húmedas.",
    "Una sombra se mueve junto al carro.",
    "¡Choque de armas! Los aceros colisionan en la niebla.",
  ],
};
