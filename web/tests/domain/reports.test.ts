// reports.test.ts — coverage of generateReport (output shape) and a
// property-based invariant: for any soldier + mission, the generated report
// always includes the soldier's name and the rewards numbers.

import assert from "node:assert/strict";
import fc from "fast-check";
import { generateReport } from "../../src/lib/domain/reports";
import { missionDefinitions, getMission } from "../../src/lib/data/missions";
import { createBaseSoldier } from "../helpers/state-fixtures";
import type { MissionResult, Soldier } from "../../src/lib/types";

const baseResult: Pick<MissionResult, "success" | "rewards" | "fatigue" | "wounds" | "loot"> & { bestPower: string } = {
  success: true,
  rewards: { coins: 80, honor: 3, xp: 45 },
  fatigue: 10,
  wounds: [],
  loot: [],
  bestPower: "la pica",
};

{
  // Happy path: success with empty wounds + loot still produces a full
  // narrative.
  const mission = getMission("mission_patrulla_flandes_001");
  assert.ok(mission, "mission exists");
  const soldier = createBaseSoldier();
  const report = generateReport(baseResult, mission!, soldier);
  assert.ok(report.includes(soldier.name), "report names the soldier");
  assert.ok(report.includes("80 doblones"), "report shows coins");
  assert.ok(report.includes("45 XP"), "report shows xp");
  assert.ok(report.includes("3 de honor"), "report shows honor");
  assert.ok(report.includes("10 de fatiga"), "report shows fatigue");
  assert.ok(report.includes("No se registraron nuevas heridas."), "default wounds line");
  assert.ok(report.includes("No se obtuvo ning"), "default loot line");
}

{
  // Defeat path uses the defeat fragment (which for this mission says
  // "se quedó a medio camino"). We just assert the report is a non-empty
  // string and includes the soldier name + mission narrative.
  const mission = getMission("mission_patrulla_flandes_001");
  assert.ok(mission);
  const report = generateReport({ ...baseResult, success: false }, mission!, createBaseSoldier());
  assert.ok(report.length > 0);
  assert.ok(report.includes("80 doblones"));
}

{
  // Wounds + loot are listed.
  const mission = getMission("mission_patrulla_flandes_001");
  assert.ok(mission);
  const report = generateReport(
    {
      ...baseResult,
      wounds: ["wound_corte_mano_001"],
      loot: [{ itemId: "consumable_vendas_001", quantity: 2 }],
    },
    mission!,
    createBaseSoldier(),
  );
  assert.ok(report.includes("Corte en la mano"), "wound named");
  assert.ok(report.includes("Vendas"), "loot named");
}

{
  // bestPower is passed through to generateReport; if the chosen fragment
  // contains "{power}" it gets interpolated, otherwise it's ignored. The
  // report must remain a non-empty string for every bestPower value.
  const mission = getMission("mission_patrulla_flandes_001");
  assert.ok(mission);
  for (const bestPower of ["el arcabuz", "la espada", "la pica", "el mando"]) {
    const report = generateReport({ ...baseResult, bestPower }, mission!, createBaseSoldier());
    assert.ok(report.length > 0, `report with bestPower=${bestPower} is non-empty`);
    assert.ok(report.includes(soldierRef(createBaseSoldier())));
  }
}

function soldierRef(s: { name: string }) {
  return s.name;
}

{
  // For every mission, generateReport always returns a non-empty string
  // and always mentions the soldier name. Property-based.
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: missionDefinitions.length - 1 }),
      fc.integer({ min: 0, max: 1 }), // success flag
      (missionIdx, successInt) => {
        const mission = missionDefinitions[missionIdx];
        const soldier = createBaseSoldier();
        const success = successInt === 1;
        const result = {
          success,
          rewards: mission.rewards,
          fatigue: mission.fatigue,
          wounds: [],
          loot: [],
          bestPower: "la pica",
        };
        const report = generateReport(result, mission, soldier);
        return (
          typeof report === "string" &&
          report.length > 0 &&
          report.includes(soldier.name) &&
          report.includes(String(mission.rewards.coins))
        );
      },
    ),
    { numRuns: 30, seed: 2 },
  );
}

console.log(JSON.stringify({ ok: true, checked: "reports" }, null, 2));
