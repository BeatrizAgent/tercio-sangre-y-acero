import { applyMissionRewardsInState } from "./missions";
import { fail, ok, type ActionResult } from "./result";
import type { GameState, MissionDefinition } from "../types";

export type TimedMissionStatus = "active" | "claimed" | "cancelled";

export interface TimedMissionState {
  id: string;
  missionId: string;
  startedAt: string;
  completesAt: string;
  status: TimedMissionStatus;
  resultId?: string | null;
}

export function missionDurationMinutes(mission: MissionDefinition) {
  const fromRewards = (mission as MissionDefinition & { rewards?: { durationMinutes?: unknown } }).rewards?.durationMinutes;
  const value = Number(fromRewards);
  if (Number.isFinite(value) && value > 0) return value;
  return Math.max(1, mission.difficulty * 5);
}

export function startTimedMissionInState({
  state,
  mission,
  now,
  activeMission,
}: {
  state: GameState;
  mission: MissionDefinition;
  now: Date;
  activeMission: TimedMissionState | null;
}): { next: GameState; activeMission: TimedMissionState; result: ActionResult<{ activeMission: TimedMissionState }> } {
  if (activeMission?.status === "active") {
    return {
      next: state,
      activeMission,
      result: fail("Ya hay una mision en marcha."),
    };
  }

  const completesAt = new Date(now.getTime() + missionDurationMinutes(mission) * 60_000);
  const nextActiveMission: TimedMissionState = {
    id: `mission_${mission.id}_${now.getTime()}`,
    missionId: mission.id,
    startedAt: now.toISOString(),
    completesAt: completesAt.toISOString(),
    status: "active",
    resultId: null,
  };

  return {
    next: {
      ...state,
      activeMission: nextActiveMission,
      pendingMissionId: mission.id,
    },
    activeMission: nextActiveMission,
    result: ok("Mision iniciada.", { activeMission: nextActiveMission }),
  };
}

export function claimTimedMissionInState({
  state,
  activeMission,
  now,
}: {
  state: GameState;
  activeMission: TimedMissionState | null;
  now: Date;
}): {
  next: GameState;
  claimedMission: TimedMissionState | null;
  result: ActionResult<{ reportId?: string }>;
} {
  if (!activeMission || activeMission.status !== "active") {
    return { next: state, claimedMission: activeMission, result: fail("No hay mision en marcha.") };
  }
  if (new Date(activeMission.completesAt).getTime() > now.getTime()) {
    return { next: state, claimedMission: activeMission, result: fail("La mision aun no ha terminado.") };
  }

  const out = applyMissionRewardsInState(
    { ...state, activeMission: null, pendingMissionId: null },
    activeMission.missionId,
  );
  if (!out.result.ok) return { next: state, claimedMission: activeMission, result: out.result };

  const claimedMission: TimedMissionState = {
    ...activeMission,
    status: "claimed",
    resultId: out.result.data?.reportId ?? null,
  };

  return {
    next: {
      ...out.next,
      activeMission: null,
      pendingMissionId: null,
    },
    claimedMission,
    result: ok(out.result.message, { reportId: out.result.data?.reportId }),
  };
}
