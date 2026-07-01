"use server";

import { revalidatePath } from "next/cache";
import {
  trainCharacterStatBoostInState,
  trainCharacterStatInState,
  trainSoldierStatBoostInState,
  trainSoldierStatInState,
} from "../domain/training";
import { loadGameState, persistGameState } from "./_demo";
import { ok, type ActionResult } from "../domain/result";
import type { StatId } from "../types";

export type TrainStatMode = "step" | "boost";

export interface TrainStatArgs {
  stat: StatId;
  characterId?: string;
  mode?: TrainStatMode;
}

export async function trainStatAction({
  stat,
  characterId,
  mode = "step",
}: TrainStatArgs): Promise<ActionResult> {
  const state = await loadGameState();
  const out =
    mode === "boost"
      ? characterId
        ? trainCharacterStatBoostInState(state, characterId, stat)
        : trainSoldierStatBoostInState(state, stat)
      : characterId
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
  await trainStatAction({ stat, characterId: undefined, mode: "step" });
}
