import assert from "node:assert/strict";
import { fightArenaOpponentInState } from "../../src/lib/domain/arena";
import { getArenaOpponent } from "../../src/lib/data/arena";
import { freezeClock } from "../helpers/time-fixtures";
import { createTestState, withFatigue, withStat } from "../helpers/state-fixtures";

const opponent = getArenaOpponent("jaime_el_cojo");
assert.ok(opponent, "sample arena opponent exists");

freezeClock(() => {
  const state = withStat(createTestState(), "sword", 20);
  const out = fightArenaOpponentInState(state, opponent.id);
  assert.equal(out.result.ok, true, "arena fight resolves");
  assert.ok(out.next.arenaResults.length > 0, "arena result recorded");
  const result = out.next.arenaResults[0];
  assert.equal(result.opponentId, opponent.id, "result links opponent");
  assert.equal(typeof result.success, "boolean", "success boolean");
});

{
  const state = withFatigue(createTestState(), 100);
  const out = fightArenaOpponentInState(state, opponent.id);
  assert.equal(out.result.ok, false, "arena blocked at 100 fatigue");
  assert.equal(out.result.message, "Diego está demasiado agotado para batirse en la arena.");
}

{
  const state = createTestState();
  const out = fightArenaOpponentInState(state, "rival_inexistente");
  assert.equal(out.result.ok, false, "unknown opponent fails");
  assert.equal(out.result.message, "Rival de arena desconocido.");
}

{
  // Arena result should change coins/xp monotonically.
  const state = withStat(createTestState(), "sword", 50);
  const out = fightArenaOpponentInState(state, opponent.id);
  assert.ok(out.next.soldier.xp >= state.soldier.xp, "xp did not decrease");
  assert.ok(out.next.soldier.coins >= state.soldier.coins, "coins did not decrease");
}

console.log(JSON.stringify({ ok: true, checked: "arena" }, null, 2));
