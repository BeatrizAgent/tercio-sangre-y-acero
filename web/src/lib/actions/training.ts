"use server";

import { revalidatePath } from "next/cache";
import { trainSoldierStatInState } from "../domain/training";
import { loadGameState, persistGameState } from "./_demo";
import type { StatId } from "../types";

export async function trainStatAction(formData: FormData) {
  const stat = String(formData.get("stat")) as StatId;
  const state = await loadGameState();
  const { next } = trainSoldierStatInState(state, stat);
  await persistGameState(next);
  revalidatePath("/training");
  revalidatePath("/soldier");
}
