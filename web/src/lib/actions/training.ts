"use server";

import { revalidatePath } from "next/cache";
import { trainCharacterStatInState, trainSoldierStatInState } from "../domain/training";
import { loadGameState, persistGameState } from "./_demo";
import { ok, type ActionResult } from "../domain/result";
import type { StatId } from "../types";

export interface TrainStatArgs {
  stat: StatId;
  characterId?: string;
}

export async function trainStatAction({
  stat,
  characterId,
}: TrainStatArgs): Promise<ActionResult> {
  const state = await loadGameState();
  const out = characterId
    ? trainCharacterStatInState(state, characterId, stat)
    : trainSoldierStatInState(state, stat);
  if (!out.result.ok) return out.result;
  await persistGameState(out.next);
  revalidatePath("/training");
  revalidatePath("/soldier");
  return ok(out.result.message);
}

// Backwards-compatible FormData shim for the few <form action=...> use sites.
export async function trainStatFormAction(formData: FormData): Promise<void> {
  const stat = String(formData.get("stat")) as StatId;
  await trainStatAction({ stat, characterId: undefined });
}
