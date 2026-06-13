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
  revalidatePath("/barracks");
}

export async function buyItemAction(formData: FormData) {
  await buyItem(String(formData.get("itemId")));
  revalidatePath("/armory");
  revalidatePath("/barracks");
}

export async function sellItemAction(formData: FormData) {
  await sellItem(String(formData.get("itemId")));
  revalidatePath("/armory");
  revalidatePath("/inventory");
  revalidatePath("/barracks");
}

export async function equipItemAction(formData: FormData) {
  await equipItem(String(formData.get("itemId")));
  revalidatePath("/equipment");
  revalidatePath("/barracks");
}

export async function resolveMissionAction(formData: FormData) {
  const result = await applyMissionRewards(String(formData.get("missionId")));
  revalidatePath("/missions");
  revalidatePath("/barracks");
  if (result.reportId) redirect(`/reports/${result.reportId}`);
}

export async function treatWoundAction(formData: FormData) {
  await treatWound(String(formData.get("woundId")));
  revalidatePath("/hospital");
  revalidatePath("/barracks");
}

export async function resetDemoAction() {
  await resetState();
  revalidatePath("/");
  redirect("/barracks");
}
