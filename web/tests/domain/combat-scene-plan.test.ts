import assert from "node:assert/strict";
import { buildCombatScenePlan, getActorStateAt } from "../../src/lib/domain/combat/combat-scene-plan";
import type { CombatResult } from "../../src/lib/domain/combat/combat-types";

const baseResult: CombatResult = {
  success: true,
  roll: 4,
  target: 12,
  modifiers: [
    { label: "Arcabuz", value: 3 },
    { label: "Disciplina", value: 2 },
  ],
  rewards: { coins: 80, honor: 3, xp: 45 },
  wounds: [],
  enemy: {
    id: "enemy_french_road",
    name: "hostigadores franceses",
    description: "Fuego suelto entre lluvia y barro.",
    power: 5,
  },
  eventLog: [],
  log: [],
};

const skirmishPlan = buildCombatScenePlan({
  missionType: "road_skirmish",
  result: baseResult,
});

assert.equal(skirmishPlan.relevantStat, "arquebus");
assert.equal(skirmishPlan.actionKind, "shot");
assert.equal(skirmishPlan.player.spriteId, "team_arquebusier");
assert.equal(skirmishPlan.enemy.spriteId, "minion_arquebus");
assert.equal(skirmishPlan.enemy.facing, 1);
assert.equal(skirmishPlan.player.scale >= 0.58, true);
assert.equal(skirmishPlan.enemy.scale >= 0.6, true);
assert.equal(skirmishPlan.loadedSpriteIds.includes("team_arquebusier"), true);
assert.equal(skirmishPlan.loadedSpriteIds.includes("minion_arquebus"), true);
assert.equal(skirmishPlan.support.filter((actor) => actor.alpha >= 0.9 && actor.scale >= 0.42).length >= 4, true);
assert.equal(skirmishPlan.support.filter((actor) => actor.side === "enemy").every((actor) => actor.facing === 1), true);
assert.equal(getActorStateAt(skirmishPlan.player, 1200), "walk");
assert.equal(getActorStateAt(skirmishPlan.player, 2650), "attack");
assert.equal(getActorStateAt(skirmishPlan.enemy, 3500), "hurt");

const duelPlan = buildCombatScenePlan({
  missionType: "tavern_duel",
  result: { ...baseResult, target: 8 },
});

assert.equal(duelPlan.relevantStat, "sword");
assert.equal(duelPlan.actionKind, "melee");
assert.equal(duelPlan.player.spriteId, "team_rodelero");
assert.equal(duelPlan.enemy.spriteId, "minion_sword");

const hardPikePlan = buildCombatScenePlan({
  missionType: "siege_breach",
  result: { ...baseResult, target: 18 },
});

assert.equal(hardPikePlan.relevantStat, "pike");
assert.equal(hardPikePlan.enemy.spriteId, "minion_pike");
assert.equal(hardPikePlan.support.some((actor) => actor.spriteId === "enemy_boss_backline"), true);

console.log(JSON.stringify({ ok: true, checked: 3 }, null, 2));
