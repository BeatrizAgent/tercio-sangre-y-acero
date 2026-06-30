"use server";

import { revalidatePath } from "next/cache";
import { resolveStoryChoiceInState } from "../domain/story";
import { fail, ok, type ActionResult } from "../domain/result";
import { consumeActionGate } from "../server/action-gate-store";
import { loadGameState, persistGameState } from "./_demo";
import type { GameState } from "../types";

export interface ResolveStoryChoiceArgs {
  chapterId: string;
  choiceId: string;
  gateToken?: string;
}

export async function resolveStoryChoiceAction({
  chapterId,
  choiceId,
  gateToken,
}: ResolveStoryChoiceArgs): Promise<ActionResult<{ state: GameState; reportId?: string }>> {
  const gate = consumeActionGate({
    token: gateToken,
    kind: "story",
    targetId: `${chapterId}:${choiceId}`,
  });
  if (!gate.ok) return fail(gate.message);

  const state = await loadGameState();
  const out = resolveStoryChoiceInState({ state, chapterId, choiceId });
  if (!out.result.ok) return out.result as ActionResult<{ state: GameState; reportId?: string }>;

  await persistGameState(out.next);
  revalidatePath("/missions");
  revalidatePath("/reports");
  revalidatePath("/soldier");
  return ok(out.result.message, { state: out.next, reportId: out.result.data?.reportId });
}
