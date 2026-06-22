import assert from "node:assert/strict";
import { trainSoldierStatInState, trainCharacterStatInState } from "../../src/lib/domain/training";
import { createTestState, withCoins, withXp, withFatigue } from "../helpers/state-fixtures";

const BASE_COINS = 200;
const BASE_XP = 50;

{
  const state = withCoins(withXp(createTestState(), BASE_XP), BASE_COINS);
  const out = trainSoldierStatInState(state, "pike");
  assert.equal(out.result.ok, true, "train pike succeeds");
  assert.equal(out.next.soldier.stats.pike, state.soldier.stats.pike + 1, "pike increased");
  assert.equal(out.next.soldier.coins, BASE_COINS - 8, "coins deducted for pike (8)");
  assert.equal(out.next.soldier.xp, BASE_XP, "xp unchanged (pike costs 0 xp)");
}

{
  const state = withCoins(withXp(createTestState(), BASE_XP), BASE_COINS);
  const out = trainSoldierStatInState(state, "command");
  assert.equal(out.result.ok, true, "train command succeeds");
  assert.equal(out.next.soldier.stats.command, state.soldier.stats.command + 1, "command increased");
  assert.equal(out.next.soldier.coins, BASE_COINS - 14, "coins deducted for command (14)");
  assert.equal(out.next.soldier.xp, BASE_XP, "xp unchanged (command costs 0 xp)");
}

{
  const state = withCoins(withXp(createTestState(), BASE_XP), 5);
  const out = trainSoldierStatInState(state, "pike");
  assert.equal(out.result.ok, false, "train fails without coins");
  assert.equal(out.result.message, "Monedas o experiencia insuficientes.");
}

{
  const state = withFatigue(withCoins(withXp(createTestState(), BASE_XP), BASE_COINS), 97);
  const out = trainSoldierStatInState(state, "vigor");
  assert.equal(out.next.soldier.fatigue, 100, "fatigue capped at 100");
}

{
  // Training a roster character updates only that character and spends coins.
  const state = withCoins(withXp(createTestState(), BASE_XP), BASE_COINS);
  const other = state.characters.find((c) => c.id !== "diego_de_arce");
  assert.ok(other, "other character exists");
  const beforePike = state.soldier.stats.pike;
  const out = trainCharacterStatInState(state, other.id, "pike");
  assert.equal(out.result.ok, true, "train companion succeeds");
  const updated = out.next.characters.find((c) => c.id === other.id);
  assert.equal(updated?.stats.pike, other.stats.pike + 1, "companion pike increased");
  assert.equal(out.next.soldier.stats.pike, beforePike, "soldier pike unchanged");
  assert.equal(out.next.soldier.coins, BASE_COINS - 8, "coins spent from soldier purse");
}

{
  const state = withCoins(withXp(createTestState(), BASE_XP), BASE_COINS);
  const out = trainCharacterStatInState(state, "desconocido", "pike");
  assert.equal(out.result.ok, false, "train unknown character fails");
  assert.equal(out.result.message, "Personaje no encontrado.");
}

console.log(JSON.stringify({ ok: true, checked: "training" }, null, 2));
