"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resetGameState } from "./_demo";

export async function resetDemoAction() {
  await resetGameState();
  revalidatePath("/");
  redirect("/city");
}
