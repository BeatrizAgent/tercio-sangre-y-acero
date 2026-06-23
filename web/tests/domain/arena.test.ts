import assert from "node:assert/strict";
import { fightArenaOpponentInState, fightArenaOpponentInStateWithOpponent } from "../../src/lib/domain/arena";
import { getArenaOpponent } from "../../src/lib/data/arena";
import { freezeClock } from "../helpers/time-fixtures";
import { createTestState, withFatigue, withStat } from "../helpers/state-fixtures";
import type { ArenaOpponent } from "../../src/lib/types";

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

freezeClock(() => {
  const injectedOpponent: ArenaOpponent = {
    id: "bot_sargento_test",
    soldierId: "soldier_bot_sargento_test",
    level: 8,
    name: "Sargento Test",
    rank: "sargento",
    power: 9,
    fatigue: 4,
    woundChance: 5,
    rewards: { coins: 8, xp: 7, honor: 2 },
    style: "Guardia cerrada.",
    description: "Bot persistido de prueba.",
  };
  const state = withStat(createTestState(), "sword", 20);
  const out = fightArenaOpponentInStateWithOpponent(state, injectedOpponent);
  assert.equal(out.result.ok, true, "injected DB opponent resolves");
  assert.equal(out.next.arenaResults[0].opponentId, injectedOpponent.id, "result links injected opponent");
});

console.log(JSON.stringify({ ok: true, checked: "arena" }, null, 2));
