// Training drills and their stat cost / gain / fatigue. Backed by the
// unified catalog.

import {
  trainingDefinitions as catalogTraining,
  getTraining as catalogGetTraining,
} from "./catalog";
import type { StatId } from "../types";

export interface TrainingOption {
  id: string;
  stat: StatId;
  name: string;
  cost: { coins: number; xp: number };
  gain: number;
  fatigue: number;
  description: string;
  requiredRankId: string;
}

export const trainingOptions: readonly TrainingOption[] = catalogTraining.map((t) => ({
  id: t.id,
  stat: t.stat,
  name: t.name,
  cost: { coins: t.baseCost, xp: 0 },
  gain: 1,
  fatigue: t.fatigueCost,
  description: t.description,
  requiredRankId: t.requiredRankId,
}));

/**
 * "Mejorar" is the big jump: 3 points for 5x coins, slightly more fatigue.
 * It mirrors the second button in DESIGN/entrenamiento.png and is only
 * available every 5 levels (or always for the first 10) to keep the
 * upgrade ladder readable.
 */
export const BOOST_GAIN = 3;
export const BOOST_COIN_MULTIPLIER = 5;
export const BOOST_FATIGUE_BONUS = 2;

export interface BoostCost {
  coins: number;
  fatigue: number;
}

export function boostCostFor(option: TrainingOption): BoostCost {
  return {
    coins: option.cost.coins * BOOST_COIN_MULTIPLIER,
    fatigue: option.fatigue + BOOST_FATIGUE_BONUS,
  };
}

/**
 * Whether "Mejorar" should be rendered for this stat. We surface it for
 * the first 10 levels unconditionally, then only at multiples of 5 so the
 * upgrade feels like a milestone.
 */
export function isBoostMilestone(currentLevel: number): boolean {
  if (currentLevel < 10) return true;
  return currentLevel % 5 === 0;
}

export function getTraining(trainingId: string | undefined) {
  return catalogGetTraining(trainingId);
}
