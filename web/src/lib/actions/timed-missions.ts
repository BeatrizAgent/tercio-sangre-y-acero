"use server";

import { revalidatePath } from "next/cache";
import { getMission } from "../data";
import { getDb } from "../db";
import { claimTimedMissionInState, startTimedMissionInState, type TimedMissionState } from "../domain/timed-missions";
import { fail, ok, type ActionResult } from "../domain/result";
import { requireApiSession } from "../auth/session";
import { loadGameState, persistGameState, shouldUseDatabase } from "./_demo";
import type { GameState } from "../types";

export interface StartTimedMissionArgs {
  missionId: string;
}

export async function startTimedMissionAction({
  missionId,
}: StartTimedMissionArgs): Promise<ActionResult<{ state: GameState; activeMission?: TimedMissionState }>> {
  const mission = getMission(missionId);
  if (!mission) return fail("Mision desconocida.");

  const session = await requireApiSession();
  const state = await loadGameState();

  if (shouldUseDatabase()) {
    const db = getDb();
    const soldier = await db.soldier.findUnique({
      where: { userId: session.userId },
      select: { id: true, activeMission: true },
    });
    if (!soldier) return fail("Soldado no encontrado.");

    const activeMission = soldier.activeMission
      ? {
          id: soldier.activeMission.id,
          missionId: soldier.activeMission.missionId,
          startedAt: soldier.activeMission.startedAt.toISOString(),
          completesAt: soldier.activeMission.completesAt.toISOString(),
          status: soldier.activeMission.status as TimedMissionState["status"],
          resultId: soldier.activeMission.resultId,
        }
      : null;
    const now = new Date();
    const out = startTimedMissionInState({ state, mission, now, activeMission });
    if (!out.result.ok) return out.result as ActionResult<{ state: GameState; activeMission?: TimedMissionState }>;

    await db.activeMission.create({
      data: {
        id: out.activeMission.id,
        soldierId: soldier.id,
        missionId,
        startedAt: new Date(out.activeMission.startedAt),
        completesAt: new Date(out.activeMission.completesAt),
        status: "active",
      },
    });
    await persistGameState(out.next);
    revalidateMissionPaths(missionId);
    return ok("Mision iniciada.", { state: out.next, activeMission: out.activeMission });
  } else {
    const activeMission = state.activeMission
      ? {
          id: state.activeMission.id,
          missionId: state.activeMission.missionId,
          startedAt: state.activeMission.startedAt,
          completesAt: state.activeMission.completesAt,
          status: state.activeMission.status,
          resultId: state.activeMission.resultId,
        }
      : null;
    const now = new Date();
    const out = startTimedMissionInState({ state, mission, now, activeMission });
    if (!out.result.ok) return out.result as ActionResult<{ state: GameState; activeMission?: TimedMissionState }>;

    await persistGameState(out.next);
    revalidateMissionPaths(missionId);
    return ok("Mision iniciada.", { state: out.next, activeMission: out.activeMission });
  }
}

export async function claimMissionAction(): Promise<ActionResult<{ state: GameState; reportId?: string }>> {
  const session = await requireApiSession();
  const state = await loadGameState();

  if (shouldUseDatabase()) {
    const db = getDb();
    const soldier = await db.soldier.findUnique({
      where: { userId: session.userId },
      select: { id: true, activeMission: true },
    });
    if (!soldier?.activeMission) return fail("No hay mision en marcha.");

    const activeMission: TimedMissionState = {
      id: soldier.activeMission.id,
      missionId: soldier.activeMission.missionId,
      startedAt: soldier.activeMission.startedAt.toISOString(),
      completesAt: soldier.activeMission.completesAt.toISOString(),
      status: soldier.activeMission.status as TimedMissionState["status"],
      resultId: soldier.activeMission.resultId,
    };
    const out = claimTimedMissionInState({ state, activeMission, now: new Date() });
    if (!out.result.ok) return out.result as ActionResult<{ state: GameState; reportId?: string }>;

    await db.activeMission.update({
      where: { id: activeMission.id },
      data: {
        status: "claimed",
        claimedAt: new Date(),
        resultId: out.result.data?.reportId ?? null,
      },
    });
    await persistGameState(out.next);
    revalidateMissionPaths(activeMission.missionId);
    return ok(out.result.message, { state: out.next, reportId: out.result.data?.reportId });
  } else {
    if (!state.activeMission) return fail("No hay mision en marcha.");
    const activeMission: TimedMissionState = {
      id: state.activeMission.id,
      missionId: state.activeMission.missionId,
      startedAt: state.activeMission.startedAt,
      completesAt: state.activeMission.completesAt,
      status: state.activeMission.status,
      resultId: state.activeMission.resultId,
    };
    const out = claimTimedMissionInState({ state, activeMission, now: new Date() });
    if (!out.result.ok) return out.result as ActionResult<{ state: GameState; reportId?: string }>;

    await persistGameState(out.next);
    revalidateMissionPaths(activeMission.missionId);
    return ok(out.result.message, { state: out.next, reportId: out.result.data?.reportId });
  }
}

function revalidateMissionPaths(missionId: string) {
  revalidatePath("/missions");
  revalidatePath(`/missions/${missionId}`);
  revalidatePath("/reports");
  revalidatePath("/soldier");
}
