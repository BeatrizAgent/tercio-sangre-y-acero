"use server";

import { revalidatePath } from "next/cache";
import { equipItemInState } from "../domain/equipment";
import { loadGameState, persistGameState } from "./_demo";
import { ok, type ActionResult } from "../domain/result";

export interface EquipItemArgs {
  itemId: string;
}

export async function equipItemAction({ itemId }: EquipItemArgs): Promise<ActionResult> {
  const state = await loadGameState();
  const { next, result } = equipItemInState(state, itemId);
  if (!result.ok) return result;
  await persistGameState(next);
  revalidatePath("/equipment");
  revalidatePath("/soldier");
  return ok(result.message);
}
