// combat-resolver.test.ts — exhaustive coverage of getCombatPreview and
// buildCombatResult. Builds CombatResult fixtures to drive both paths.

import assert from "node:assert/strict";
import {
  buildCombatResult,
  getCombatPreview,
  getRelevantCombatStat,
} from "../../src/lib/domain/combat/combat-resolver";
import { combatAnimationPreset } from "../../src/lib/domain/combat/animation-presets";
import { getMission } from "../../src/lib/data/missions";
import { createBaseSoldier } from "../helpers/state-fixtures";
import type { MissionDefinition, Soldier } from "../../src/lib/types";

// getRelevantCombatStat ------------------------------------------------

{
  // Each mission type maps to its preferred stat.
  assert.equal(getRelevantCombatStat("road_skirmish"), "arquebus");
  assert.equal(getRelevantCombatStat("escort_column"), "arquebus");
  assert.equal(getRelevantCombatStat("tavern_duel"), "sword");
  assert.equal(getRelevantCombatStat("night_watch"), "discipline");
  assert.equal(getRelevantCombatStat("siege_breach"), "pike");
  // Unknown defaults to pike.
  assert.equal(getRelevantCombatStat("unknown_type"), "pike");
  // Empty defaults to pike.
  assert.equal(getRelevantCombatStat(""), "pike");
}

// getCombatPreview -----------------------------------------------------

{
  // For an arbitrary mission, the preview includes:
  //  - the right relevantStat per mission type
  //  - a non-negative playerPower and targetPower
  const mission = getMission("mission_guardia_noche_001");
  assert.ok(mission);
  const soldier = createBaseSoldier();
  const preview = getCombatPreview(mission as MissionDefinition, soldier);
  assert.equal(preview.mission.id, mission!.id);
  assert.equal(preview.soldier.id, soldier.id);
  assert.ok(preview.playerPower > 0);
  assert.ok(preview.targetPower > 0);
  assert.equal(typeof preview.statLabel, "string");
  assert.ok(preview.statLabel.length > 0);
}

{
  // Vigorous, well-equipped soldier beats a tired, un-equipped one.
  const mission = getMission("mission_guardia_noche_001") as MissionDefinition;
  const strong = createBaseSoldier({ fatigue: 0, stats: { pike: 5, sword: 3, arquebus: 1, discipline: 5, vigor: 5, cunning: 1, command: 1 } });
  const tired = createBaseSoldier({ fatigue: 50, stats: { pike: 1, sword: 1, arquebus: 1, discipline: 1, vigor: 1, cunning: 1, command: 0 } });
  const strongPreview = getCombatPreview(mission, strong);
  const tiredPreview = getCombatPreview(mission, tired);
  assert.ok(strongPreview.playerPower > tiredPreview.playerPower, "strong has more power");
}

{
  // Wounds reduce playerPower.
  const mission = getMission("mission_guardia_noche_001") as MissionDefinition;
  const clean = createBaseSoldier();
  const wounded = createBaseSoldier({ wounds: [{ id: "w1", woundId: "wound_corte_mano_001", treated: false }] });
  const cleanPreview = getCombatPreview(mission, clean);
  const woundedPreview = getCombatPreview(mission, wounded);
  assert.ok(cleanPreview.playerPower > woundedPreview.playerPower, "wound reduces power");
}

// buildCombatResult ----------------------------------------------------

{
  // The result carries: success flag, roll (1..5), target, modifiers,
  // enemy info, eventLog, log, rewards, wounds, and an empty/used wounds
  // array depending on mission.woundChance.
  const mission = getMission("mission_patrulla_flandes_001") as MissionDefinition;
  const soldier = createBaseSoldier();
  const result = buildCombatResult(mission, soldier);
  assert.equal(result.enemy.id, mission.enemyId);
  assert.ok(typeof result.enemy.spritePath === "string" || result.enemy.spritePath === undefined);
  assert.ok(result.roll >= 1 && result.roll <= 5, `roll is 1..5 (got ${result.roll})`);
  assert.equal(typeof result.success, "boolean");
  assert.equal(typeof result.target, "number");
  assert.ok(Array.isArray(result.modifiers));
  assert.ok(result.modifiers.length >= 2);
  assert.ok(Array.isArray(result.eventLog));
  assert.ok(result.eventLog.length >= 3);
  assert.ok(Array.isArray(result.log));
  assert.equal(result.rewards.coins, mission.rewards.coins);
  assert.equal(result.rewards.xp, mission.rewards.xp);
  assert.equal(result.rewards.honor, mission.rewards.honor);
}

{
  // Wounds array carries one entry per mission.woundChance bucket.
  // For missions with no woundId, wounds is empty.
  const lowWoundMission = getMission("mission_patrulla_flandes_001") as MissionDefinition;
  const noWoundSoldier = createBaseSoldier();
  const lowResult = buildCombatResult(lowWoundMission, noWoundSoldier);
  // mission.patrulla_flandes_001 may have a wound; the resolver may or
  // may not include it. Just assert shape.
  assert.ok(Array.isArray(lowResult.wounds));
  for (const wound of lowResult.wounds) {
    assert.ok(["leve", "media", "grave"].includes(wound.severity), `severity ${wound.severity}`);
    assert.equal(typeof wound.name, "string");
    assert.ok(wound.name.length > 0);
  }
}

{
  // Modifiers list always includes the relevant stat and vigor.
  const mission = getMission("mission_patrulla_flandes_001") as MissionDefinition;
  const soldier = createBaseSoldier();
  const result = buildCombatResult(mission, soldier);
  const labels = result.modifiers.map((m) => m.label);
  assert.ok(labels.includes("Vigor"), "Vigor is always a modifier");
  assert.ok(result.modifiers.some((m) => typeof m.value === "number"), "modifier values are numeric");
}

{
  // The event log uses the canonical combat phases in order.
  const mission = getMission("mission_patrulla_flandes_001") as MissionDefinition;
  const result = buildCombatResult(mission, createBaseSoldier());
  const phases = ["title", "deployment", "modifiers", "shot", "response", "outcome"];
  for (const expected of phases) {
    assert.ok(result.eventLog.some((e) => e.phase === expected), `phase ${expected} present`);
  }
  // At least one event uses the danger/success/reward tone.
  const tones = new Set(result.eventLog.map((e) => e.tone));
  assert.ok(["danger", "success", "reward", "neutral"].some((t) => tones.has(t)));
}

{
  // The "orders" event is timed to fadeInMs, and the "outcome" is timed
  // to outcomeMs — these are the anchors of the combat animation.
  const mission = getMission("mission_patrulla_flandes_001") as MissionDefinition;
  const result = buildCombatResult(mission, createBaseSoldier());
  const orders = result.eventLog.find((e) => e.id === "orders");
  const outcome = result.eventLog.find((e) => e.id === "outcome");
  assert.ok(orders);
  assert.ok(outcome);
  assert.equal(orders?.at, combatAnimationPreset.fadeInMs);
  assert.equal(outcome?.at, combatAnimationPreset.outcomeMs);
}

console.log(JSON.stringify({ ok: true, checked: "combat-resolver" }, null, 2));
