"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buyItemInState, sellItemInState } from "../domain/shop";
import { applyMissionRewardsInState } from "../domain/missions";
import { loadGameState, persistGameState } from "./_demo";

export async function buyItemAction(formData: FormData) {
  const itemId = String(formData.get("itemId"));
  const state = await loadGameState();
  const { next } = buyItemInState(state, itemId);
  await persistGameState(next);
  revalidatePath("/armory");
  revalidatePath("/soldier");
}

export async function sellItemAction(formData: FormData) {
  const itemId = String(formData.get("itemId"));
  const state = await loadGameState();
  const { next } = sellItemInState(state, itemId);
  await persistGameState(next);
  revalidatePath("/armory");
  revalidatePath("/inventory");
  revalidatePath("/soldier");
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
