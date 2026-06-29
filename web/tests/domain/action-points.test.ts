// action-points.test.ts — exhaustive coverage of the action-point regen
// logic that backs the /missions "12 puntos, 30 min" rule.

import assert from "node:assert/strict";
import { MAX_ACTION_POINTS, REGEN_TIME_MS, regenerateActionPoints } from "../../src/lib/domain/action-points";
import { createTestState, withFatigue } from "../helpers/state-fixtures";
import { withActionPoints } from "../helpers/with-resources";

{
  // First-time setup: undefined actionPoints + undefined lastRegenAt ->
  // 12 max, lastRegenAt = now, updated=true.
  const state = createTestState();
  // Wipe actionPoints/lastRegenAt to simulate legacy state.
  const soldier = { ...state.soldier, actionPoints: undefined, lastRegenAt: undefined };
  const next = { ...state, soldier };
  const now = new Date("2026-06-25T12:00:00.000Z");
  const out = regenerateActionPoints(soldier, now);
  assert.equal(out.soldier.actionPoints, MAX_ACTION_POINTS);
  assert.equal(out.soldier.lastRegenAt, now.toISOString());
  assert.equal(out.updated, true);
}

{
  // At max and lastRegenAt present: no mutation, no updated flag.
  const state = createTestState();
  const lastRegenAt = "2026-06-25T10:00:00.000Z";
  const full = withActionPoints(state, 12, lastRegenAt).soldier;
  const now = new Date("2026-06-25T11:00:00.000Z");
  const out = regenerateActionPoints(full, now);
  assert.equal(out.soldier.actionPoints, 12);
  assert.equal(out.soldier.lastRegenAt, lastRegenAt);
  assert.equal(out.updated, false);
}

{
  // Below max, lastRegenAt present, not enough time elapsed: no regen.
  const state = createTestState();
  const now = new Date("2026-06-25T12:00:00.000Z");
  const before = new Date(now.getTime() - REGEN_TIME_MS / 2);
  const soldier = withActionPoints(state, 8, before.toISOString()).soldier;
  const out = regenerateActionPoints(soldier, now);
  assert.equal(out.soldier.actionPoints, 8);
  assert.equal(out.soldier.lastRegenAt, before.toISOString());
  assert.equal(out.updated, false);
}

{
  // One full period elapsed: +1 point, lastRegenAt = now.
  const state = createTestState();
  const now = new Date("2026-06-25T12:00:00.000Z");
  const before = new Date(now.getTime() - REGEN_TIME_MS);
  const soldier = withActionPoints(state, 8, before.toISOString()).soldier;
  const out = regenerateActionPoints(soldier, now);
  assert.equal(out.soldier.actionPoints, 9);
  assert.equal(out.soldier.lastRegenAt, now.toISOString());
  assert.equal(out.updated, true);
}

{
  // Multiple periods elapsed in one call: +N points, capped to 12.
  const state = createTestState();
  const now = new Date("2026-06-25T12:00:00.000Z");
  const before = new Date(now.getTime() - REGEN_TIME_MS * 5);
  const soldier = withActionPoints(state, 4, before.toISOString()).soldier;
  const out = regenerateActionPoints(soldier, now);
  // 4 + 5 = 9; cap is 12, not reached.
  assert.equal(out.soldier.actionPoints, 9);
  assert.equal(out.soldier.lastRegenAt, now.toISOString());
  assert.equal(out.updated, true);
}

{
  // Capped: +N but never above MAX_ACTION_POINTS.
  const state = createTestState();
  const now = new Date("2026-06-25T12:00:00.000Z");
  const before = new Date(now.getTime() - REGEN_TIME_MS * 100);
  const soldier = withActionPoints(state, 8, before.toISOString()).soldier;
  const out = regenerateActionPoints(soldier, now);
  assert.equal(out.soldier.actionPoints, MAX_ACTION_POINTS);
  assert.equal(out.soldier.lastRegenAt, now.toISOString());
}

{
  // Regen near the cap: lastRegenAt is bumped to the regen deadline
  // (now), not a future tick.
  const state = createTestState();
  const now = new Date("2026-06-25T12:00:00.000Z");
  const before = new Date(now.getTime() - REGEN_TIME_MS * 2 - 1_000);
  const soldier = withActionPoints(state, 11, before.toISOString()).soldier;
  const out = regenerateActionPoints(soldier, now);
  assert.equal(out.soldier.actionPoints, MAX_ACTION_POINTS);
  assert.equal(out.soldier.lastRegenAt, now.toISOString());
}

{
  // Regen exactly at the deadline: +1 point.
  const state = createTestState();
  const now = new Date("2026-06-25T12:00:00.000Z");
  const before = new Date(now.getTime() - REGEN_TIME_MS);
  const soldier = withActionPoints(state, 7, before.toISOString()).soldier;
  const out = regenerateActionPoints(soldier, now);
  assert.equal(out.soldier.actionPoints, 8);
  assert.equal(out.soldier.lastRegenAt, now.toISOString());
}

{
  // Below max and no lastRegenAt: keeps current, stamps lastRegenAt.
  const state = createTestState();
  const soldier = { ...state.soldier, actionPoints: 5, lastRegenAt: undefined };
  const now = new Date("2026-06-25T12:00:00.000Z");
  const out = regenerateActionPoints(soldier, now);
  assert.equal(out.soldier.actionPoints, 5);
  assert.equal(out.soldier.lastRegenAt, now.toISOString());
  assert.equal(out.updated, true);
}

{
  // At max but lastRegenAt missing: stamps lastRegenAt, updated=true.
  const state = createTestState();
  const soldier = { ...state.soldier, actionPoints: 12, lastRegenAt: undefined };
  const now = new Date("2026-06-25T12:00:00.000Z");
  const out = regenerateActionPoints(soldier, now);
  assert.equal(out.soldier.actionPoints, 12);
  assert.equal(out.soldier.lastRegenAt, now.toISOString());
  assert.equal(out.updated, true);
}

{
  // Now defaults to Date.now() if omitted.
  const before = Date.now();
  const state = createTestState();
  const soldier = withActionPoints(state, 0, new Date(before - REGEN_TIME_MS).toISOString()).soldier;
  const out = regenerateActionPoints(soldier);
  assert.ok(out.soldier.actionPoints >= 1);
  assert.ok(new Date(out.soldier.lastRegenAt).getTime() >= before);
}

console.log(JSON.stringify({ ok: true, checked: "action-points" }, null, 2));
