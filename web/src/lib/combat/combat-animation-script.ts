import type { CombatScenePhase } from "./combat-types";

export interface CombatCue {
  phase: CombatScenePhase;
  at: number;
  label: string;
}

export const COMBAT_CANVAS_WIDTH = 1280;
export const COMBAT_CANVAS_HEIGHT = 720;
export const COMBAT_ASPECT_RATIO = 16 / 9;

export const combatAnimationScript: CombatCue[] = [
  { phase: "fade-in", at: 0, label: "Scene fades in under rain." },
  { phase: "title", at: 450, label: "Mission title appears." },
  { phase: "deployment", at: 900, label: "Player line and enemy silhouettes deploy." },
  { phase: "modifiers", at: 1550, label: "Modifiers and deterministic roll appear." },
  { phase: "shot", at: 2550, label: "Arquebus or weapon action fires." },
  { phase: "response", at: 3350, label: "Enemy answer and clash sparks." },
  { phase: "outcome", at: 4700, label: "Outcome badge and continue button." },
];

export const outcomeDelayMs = 5000;
