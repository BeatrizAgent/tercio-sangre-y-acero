"use server";

import { revalidatePath } from "next/cache";
import { equipItemInState } from "../domain/equipment";
import { loadGameState, persistGameState } from "./_demo";

export async function equipItemAction(formData: FormData) {
  const itemId = String(formData.get("itemId"));
  const state = await loadGameState();
  const { next } = equipItemInState(state, itemId);
  await persistGameState(next);
  revalidatePath("/equipment");
  revalidatePath("/soldier");
}
