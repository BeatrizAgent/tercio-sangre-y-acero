import assert from "node:assert/strict";
import {
  claimTimedMissionInState,
  startTimedMissionInState,
  type TimedMissionState,
} from "../../src/lib/domain/timed-missions";
import { getMission } from "../../src/lib/data/missions";
import { createTestState, withStat } from "../helpers/state-fixtures";

const mission = getMission("mission_guardia_noche_001");
assert.ok(mission, "sample mission exists");

{
  const now = new Date("2026-06-24T10:00:00.000Z");
  const state = withStat(createTestState(), "discipline", 20);
  const out = startTimedMissionInState({
    state,
    mission,
    now,
    activeMission: null,
  });

  assert.equal(out.result.ok, true, "starts a timed mission");
  assert.equal(out.activeMission.missionId, mission.id, "stores mission id");
  assert.equal(out.activeMission.status, "active", "mission remains active");
  assert.ok(out.activeMission.completesAt > now.toISOString(), "completion deadline is in future");
}

{
  const now = new Date("2026-06-24T10:00:00.000Z");
  const state = createTestState();
  const activeMission: TimedMissionState = {
    id: "active_1",
    missionId: mission.id,
    startedAt: now.toISOString(),
    completesAt: new Date(now.getTime() + 60_000).toISOString(),
    status: "active",
  };

  const out = startTimedMissionInState({
    state,
    mission,
    now,
    activeMission,
  });

  assert.equal(out.result.ok, false, "rejects second active mission");
  assert.equal(out.result.message, "Ya hay una mision en marcha.");
}

{
  const now = new Date("2026-06-24T10:00:00.000Z");
  const state = createTestState();
  const activeMission: TimedMissionState = {
    id: "active_1",
    missionId: mission.id,
    startedAt: now.toISOString(),
    completesAt: new Date(now.getTime() + 60_000).toISOString(),
    status: "active",
  };

  const out = claimTimedMissionInState({ state, activeMission, now });
  assert.equal(out.result.ok, false, "cannot claim before completion");
  assert.equal(out.result.message, "La mision aun no ha terminado.");
  assert.equal(out.next.reports.length, 0, "no report created early");
}

{
  const now = new Date("2026-06-24T10:10:00.000Z");
  const state = withStat(createTestState(), "discipline", 20);
  const activeMission: TimedMissionState = {
    id: "active_1",
    missionId: mission.id,
    startedAt: "2026-06-24T10:00:00.000Z",
    completesAt: "2026-06-24T10:05:00.000Z",
    status: "active",
  };

  const out = claimTimedMissionInState({ state, activeMission, now });
  assert.equal(out.result.ok, true, "claims completed mission");
  assert.equal(out.result.data?.reportId, out.next.reports[0]?.id, "returns new report id");
  assert.equal(out.claimedMission?.status, "claimed", "marks mission claimed");
  assert.equal(out.next.reports.length, 1, "creates one report");
}

console.log(JSON.stringify({ ok: true, checked: "timed-missions" }, null, 2));
