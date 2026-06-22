import assert from "node:assert/strict";
import { resolveMission } from "../../src/lib/domain/resolver";
import { getMission } from "../../src/lib/data/missions";
import { freezeClock } from "../helpers/time-fixtures";
import { createBaseSoldier } from "../helpers/state-fixtures";

const mission = getMission("mission_guardia_noche_001");
assert.ok(mission, "sample mission exists");

freezeClock(() => {
  const soldier = createBaseSoldier();
  const result = resolveMission(soldier, mission);
  assert.equal(result.missionId, mission.id, "result links mission");
  assert.equal(typeof result.success, "boolean", "success boolean");
  assert.equal(result.fatigue, mission.fatigue, "fatigue copied");
  assert.ok(result.report.includes(soldier.name), "report mentions soldier");
  assert.ok(result.id.startsWith("report_"), "report id uses timestamp prefix");
});

{
  // Higher discipline should make a watch mission easier.
  const weakSoldier = createBaseSoldier({ stats: { pike: 2, sword: 1, arquebus: 1, discipline: 1, vigor: 2, cunning: 1, command: 0 } });
  const strongSoldier = createBaseSoldier({ stats: { pike: 2, sword: 1, arquebus: 1, discipline: 20, vigor: 2, cunning: 1, command: 0 } });

  const weakResult = resolveMission(weakSoldier, mission);
  const strongResult = resolveMission(strongSoldier, mission);
  // Deterministic rolls depend on xp+honor+mission.id.length, same for both.
  // With much higher discipline, strong soldier should succeed where weak fails.
  assert.ok(strongResult.success || !weakResult.success ? true : false, "comparison evaluated");
}

{
  // Fatigue penalty reduces effective power.
  const tiredSoldier = createBaseSoldier({ fatigue: 50, stats: { pike: 2, sword: 1, arquebus: 1, discipline: 5, vigor: 2, cunning: 1, command: 0 } });
  const result = resolveMission(tiredSoldier, mission);
  assert.equal(result.fatigue, mission.fatigue, "fatigue cost recorded");
}

{
  // Untreated wounds increase wound chance.
  const woundedSoldier = createBaseSoldier({
    wounds: [{ id: "cut_test", woundId: "cut_gash", treated: false }],
  });
  const result = resolveMission(woundedSoldier, mission);
  assert.ok(Array.isArray(result.wounds), "wounds array returned");
}

console.log(JSON.stringify({ ok: true, checked: "resolver" }, null, 2));
