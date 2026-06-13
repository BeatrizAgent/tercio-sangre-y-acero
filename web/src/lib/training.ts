import { revalidatePath } from "next/cache";
import { trainingOptions } from "./game-data";
import { getState, saveState } from "./demo-store";
import type { StatId } from "./types";

export function listTrainingOptions() {
  return trainingOptions;
}

export async function trainStat(stat: StatId) {
  const state = await getState();
  const option = trainingOptions.find((entry) => entry.stat === stat);
  if (!option) return { ok: false, message: "Unknown drill." };
  if (state.soldier.coins < option.cost.coins || state.soldier.xp < option.cost.xp) {
    return { ok: false, message: "Not enough coin or experience." };
  }
  state.soldier.coins -= option.cost.coins;
  state.soldier.xp -= option.cost.xp;
  state.soldier.stats[stat] += option.gain;
  state.soldier.fatigue = Math.min(100, state.soldier.fatigue + option.fatigue);
  await saveState(state);
  revalidatePath("/");
  return { ok: true, message: `Trained ${option.name}.` };
}
