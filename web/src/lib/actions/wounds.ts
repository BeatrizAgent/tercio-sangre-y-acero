"use server";

import { revalidatePath } from "next/cache";
import { treatWoundInState } from "../domain/wounds";
import { loadGameState, persistGameState } from "./_demo";

export async function treatWoundAction(formData: FormData) {
  const woundId = String(formData.get("woundId"));
  const state = await loadGameState();
  const { next } = treatWoundInState(state, woundId);
  await persistGameState(next);
  revalidatePath("/hospital");
  revalidatePath("/soldier");
}
