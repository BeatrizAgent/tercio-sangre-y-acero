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

export function getTraining(trainingId: string | undefined) {
  return catalogGetTraining(trainingId);
}
