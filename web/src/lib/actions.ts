"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { equipItem } from "./equipment";
import { applyMissionRewards } from "./missions";
import { buyItem, sellItem } from "./shop";
import { resetState } from "./demo-store";
import { trainStat } from "./training";
import { treatWound } from "./wounds";
import type { StatId } from "./types";

export async function trainStatAction(formData: FormData) {
  await trainStat(String(formData.get("stat")) as StatId);
  revalidatePath("/training");
  revalidatePath("/soldier");
}

export async function buyItemAction(formData: FormData) {
  await buyItem(String(formData.get("itemId")));
  revalidatePath("/armory");
  revalidatePath("/soldier");
}

export async function sellItemAction(formData: FormData) {
  await sellItem(String(formData.get("itemId")));
  revalidatePath("/armory");
  revalidatePath("/inventory");
  revalidatePath("/soldier");
}

export async function equipItemAction(formData: FormData) {
  await equipItem(String(formData.get("itemId")));
  revalidatePath("/equipment");
  revalidatePath("/soldier");
}

export async function resolveMissionAction(formData: FormData) {
  const result = await applyMissionRewards(String(formData.get("missionId")));
  revalidatePath("/missions");
  revalidatePath("/soldier");
  if (result.reportId) redirect(`/reports/${result.reportId}`);
}

export async function treatWoundAction(formData: FormData) {
  await treatWound(String(formData.get("woundId")));
  revalidatePath("/hospital");
  revalidatePath("/soldier");
}

export async function resetDemoAction() {
  await resetState();
  revalidatePath("/");
  redirect("/city");
}
