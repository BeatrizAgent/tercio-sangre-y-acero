"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buyItemInState, sellItemInState } from "../domain/shop";
import { applyMissionRewardsInState } from "../domain/missions";
import { loadGameState, persistGameState } from "./_demo";
import { ok, type ActionResult } from "../domain/result";

export interface BuyItemArgs {
  itemId: string;
}

export async function buyItemAction({ itemId }: BuyItemArgs): Promise<ActionResult> {
  const state = await loadGameState();
  const { next, result } = buyItemInState(state, itemId);
  if (!result.ok) return result;
  await persistGameState(next);
  revalidatePath("/armory");
  revalidatePath("/soldier");
  return ok(result.message);
}

export interface SellItemArgs {
  itemId: string;
}

export async function sellItemAction({ itemId }: SellItemArgs): Promise<ActionResult> {
  const state = await loadGameState();
  const { next, result } = sellItemInState(state, itemId);
  if (!result.ok) return result;
  await persistGameState(next);
  revalidatePath("/armory");
  revalidatePath("/inventory");
  revalidatePath("/soldier");
  return ok(result.message);
}

export async function resolveMissionAction(formData: FormData) {
  const missionId = String(formData.get("missionId"));
  const state = await loadGameState();
  const { next, result } = applyMissionRewardsInState(state, missionId);
  await persistGameState(next);
  revalidatePath("/missions");
  revalidatePath("/soldier");
  if (result.data?.reportId) redirect(`/reports/${result.data.reportId}`);
}
