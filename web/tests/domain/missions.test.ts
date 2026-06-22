import assert from "node:assert/strict";
import { applyMissionRewardsInState } from "../../src/lib/domain/missions";
import { getMission } from "../../src/lib/data/missions";
import { freezeClock } from "../helpers/time-fixtures";
import { createTestState, withStat } from "../helpers/state-fixtures";

const mission = getMission("mission_guardia_noche_001");
assert.ok(mission, "sample mission exists");

freezeClock(() => {
  const state = withStat(createTestState(), "discipline", 20);
  const out = applyMissionRewardsInState(state, mission.id);
  assert.equal(out.result.ok, true, "mission rewards applied");

  const report = out.next.reports[0];
  assert.ok(report, "report created");
  assert.equal(report.missionId, mission.id, "report links mission");
  assert.equal(typeof report.success, "boolean", "success boolean set");
  assert.ok(report.report.length > 0, "report text generated");

  // Fatigue increases.
  assert.equal(out.next.soldier.fatigue, state.soldier.fatigue + mission.fatigue, "fatigue added");

  // Coins/xp/honor change monotonically (success gives full, failure partial).
  assert.ok(
    out.next.soldier.coins >= state.soldier.coins,
    "coins did not decrease",
  );
  assert.ok(
    out.next.soldier.xp >= state.soldier.xp,
    "xp did not decrease",
  );
});

{
  const state = createTestState();
  const out = applyMissionRewardsInState(state, "mision_inexistente");
  assert.equal(out.result.ok, false, "unknown mission fails");
  assert.equal(out.result.message, "Misión desconocida.");
}

console.log(JSON.stringify({ ok: true, checked: "missions" }, null, 2));
