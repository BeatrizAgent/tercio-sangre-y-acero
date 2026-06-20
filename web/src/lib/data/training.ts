// Training drills and their stat cost / gain / fatigue. The drill list is
// used by the Training screen and by the soldier-page state; the cost/gain
// math is in `lib/domain/training.ts` (commit 3).

import type { StatId } from "../types";

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
