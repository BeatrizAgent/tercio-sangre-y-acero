import assert from "node:assert/strict";
import {
  trainCharacterStatBoostInState,
  trainCharacterStatInState,
  trainSoldierStatBoostInState,
  trainSoldierStatInState,
} from "../../src/lib/domain/training";
import {
  fatigueImpact,
  previewStatBonus,
  recommendTraining,
  statDescriptor,
} from "../../src/lib/domain/training-preview";
import {
  BOOST_COIN_MULTIPLIER,
  BOOST_FATIGUE_BONUS,
  BOOST_GAIN,
  boostCostFor,
  isBoostMilestone,
} from "../../src/lib/data/training";
import { createTestState, withCoins, withFatigue, withStat, withXp } from "../helpers/state-fixtures";
import { recruitmentCandidates } from "../../src/lib/data/recruitment";
import { PLAYER_CHARACTER_ID } from "../../src/lib/domain/player-character";
import type { StatId } from "../../src/lib/types";

const BASE_COINS = 200;
const BASE_XP = 50;

let casesRun = 0;
function check(name: string, fn: () => void) {
  fn();
  casesRun += 1;
  console.log(`  - ${name}`);
}

// ---------------------------------------------------------------------------
// Existing behaviour: step training
// ---------------------------------------------------------------------------

check("trainSoldierStatInState: pike (+1) costs 8 coins and 3 fatigue", () => {
  const state = withCoins(withXp(createTestState(), BASE_XP), BASE_COINS);
  const out = trainSoldierStatInState(state, "pike");
  assert.equal(out.result.ok, true);
  assert.equal(out.next.soldier.stats.pike, state.soldier.stats.pike + 1);
  assert.equal(out.next.soldier.coins, BASE_COINS - 8);
  assert.equal(out.next.soldier.fatigue, 3);
});

check("trainSoldierStatInState: command costs 14 coins (no XP)", () => {
  const state = withCoins(withXp(createTestState(), BASE_XP), BASE_COINS);
  const out = trainSoldierStatInState(state, "command");
  assert.equal(out.result.ok, true);
  assert.equal(out.next.soldier.coins, BASE_COINS - 14);
  assert.equal(out.next.soldier.xp, BASE_XP);
});

check("trainSoldierStatInState: rejects when coins are insufficient", () => {
  const state = withCoins(withXp(createTestState(), BASE_XP), 5);
  const out = trainSoldierStatInState(state, "pike");
  assert.equal(out.result.ok, false);
  assert.equal(out.result.message, "Monedas o experiencia insuficientes.");
});

check("trainSoldierStatInState: rejects when fatigue has no margin", () => {
  const state = withFatigue(withCoins(withXp(createTestState(), BASE_XP), BASE_COINS), 99);
  const out = trainSoldierStatInState(state, "pike");
  assert.equal(out.result.ok, false);
  assert.equal(out.result.message, "La fatiga no admite más instrucción.");
});

check("trainSoldierStatInState: caps fatigue at 100 when there is still some margin", () => {
  // pike adds 3 fatigue; 97 + 3 = 100, must clamp.
  const state = withFatigue(withCoins(withXp(createTestState(), BASE_XP), BASE_COINS), 97);
  const out = trainSoldierStatInState(state, "pike");
  assert.equal(out.result.ok, true);
  assert.equal(out.next.soldier.fatigue, 100);
});

check("trainSoldierStatInState: rejects when fatigue has zero margin", () => {
  // pike adds 3 fatigue; 98 + 3 = 101 > 100, must reject.
  const state = withFatigue(withCoins(withXp(createTestState(), BASE_XP), BASE_COINS), 98);
  const out = trainSoldierStatInState(state, "pike");
  assert.equal(out.result.ok, false);
});

check("trainCharacterStatInState: companion training spends coins and updates only that character", () => {
  const candidate = recruitmentCandidates.find((entry) => entry.id === "tomas_de_orduna");
  assert.ok(candidate, "candidate exists");
  const base = createTestState();
  const state = {
    ...withCoins(withXp(base, BASE_XP), BASE_COINS),
    characters: [...base.characters, { ...candidate.character, unlocked: true }],
  };
  const other = state.characters.find((c) => c.id === candidate.character.id);
  assert.ok(other);
  const beforePike = state.soldier.stats.pike;
  const out = trainCharacterStatInState(state, other.id, "pike");
  assert.equal(out.result.ok, true);
  const updated = out.next.characters.find((c) => c.id === other.id);
  assert.equal(updated?.stats.pike, other.stats.pike + 1);
  assert.equal(out.next.soldier.stats.pike, beforePike);
  assert.equal(out.next.soldier.coins, BASE_COINS - 8);
});

check("trainCharacterStatInState: rejects when companion fatigue has no margin", () => {
  const candidate = recruitmentCandidates.find((entry) => entry.id === "tomas_de_orduna");
  assert.ok(candidate);
  const base = createTestState();
  const tired = { ...candidate.character, fatigue: 99, unlocked: true };
  const state = {
    ...withCoins(withXp(base, BASE_XP), BASE_COINS),
    characters: [...base.characters, tired],
  };
  const out = trainCharacterStatInState(state, tired.id, "pike");
  assert.equal(out.result.ok, false);
  assert.match(out.result.message, /agotado/);
});

check("trainCharacterStatInState: unknown character fails", () => {
  const state = withCoins(withXp(createTestState(), BASE_XP), BASE_COINS);
  const out = trainCharacterStatInState(state, "desconocido", "pike");
  assert.equal(out.result.ok, false);
  assert.equal(out.result.message, "Personaje no encontrado.");
});

// ---------------------------------------------------------------------------
// New: "Mejorar" (boost) mode
// ---------------------------------------------------------------------------

check("trainSoldierStatBoostInState: +3 stat for 5x coins, +2 fatigue", () => {
  const state = withCoins(withXp(createTestState(), BASE_XP), BASE_COINS);
  const out = trainSoldierStatBoostInState(state, "pike");
  assert.equal(out.result.ok, true);
  assert.equal(out.next.soldier.stats.pike, state.soldier.stats.pike + BOOST_GAIN);
  assert.equal(out.next.soldier.coins, BASE_COINS - 8 * BOOST_COIN_MULTIPLIER);
  // base pike fatigue is 3 + BOOST_FATIGUE_BONUS (2) = 5
  assert.equal(out.next.soldier.fatigue, 3 + BOOST_FATIGUE_BONUS);
});

check("trainSoldierStatBoostInState: rejects when coins insufficient for 5x", () => {
  const state = withCoins(withXp(createTestState(), BASE_XP), 39);
  const out = trainSoldierStatBoostInState(state, "pike");
  assert.equal(out.result.ok, false);
  assert.match(out.result.message, /Monedas insuficientes/);
});

check("trainSoldierStatBoostInState: rejects when boost fatigue would overflow", () => {
  // vigor base fatigue 4 + bonus 2 = 6; 99 + 6 > 100
  const state = withFatigue(withCoins(withXp(createTestState(), BASE_XP), BASE_COINS), 99);
  const out = trainSoldierStatBoostInState(state, "vigor");
  assert.equal(out.result.ok, false);
  assert.match(out.result.message, /fatiga/);
});

check("trainCharacterStatBoostInState: companion receives +3 and spends coins", () => {
  const candidate = recruitmentCandidates.find((entry) => entry.id === "tomas_de_orduna");
  assert.ok(candidate);
  const base = createTestState();
  const state = {
    ...withCoins(withXp(base, BASE_XP), BASE_COINS),
    characters: [...base.characters, { ...candidate.character, unlocked: true }],
  };
  const other = state.characters.find((c) => c.id === candidate.character.id);
  assert.ok(other);
  const out = trainCharacterStatBoostInState(state, other.id, "pike");
  assert.equal(out.result.ok, true);
  const updated = out.next.characters.find((c) => c.id === other.id);
  assert.equal(updated?.stats.pike, other.stats.pike + BOOST_GAIN);
  assert.equal(out.next.soldier.coins, BASE_COINS - 8 * BOOST_COIN_MULTIPLIER);
});

check("trainCharacterStatBoostInState: training the player mirrors into soldier", () => {
  const base = withCoins(withXp(createTestState(), BASE_XP), BASE_COINS);
  const out = trainCharacterStatBoostInState(base, PLAYER_CHARACTER_ID, "pike");
  assert.equal(out.result.ok, true);
  assert.equal(out.next.soldier.stats.pike, base.soldier.stats.pike + BOOST_GAIN);
  assert.equal(out.next.soldier.coins, BASE_COINS - 8 * BOOST_COIN_MULTIPLIER);
});

// ---------------------------------------------------------------------------
// New: previewStatBonus
// ---------------------------------------------------------------------------

check("previewStatBonus: current and next level differ by exactly one", () => {
  const preview = previewStatBonus("pike", 5);
  assert.equal(preview.nextLevel, 6);
  assert.equal(preview.next.primary, preview.current.primary + 1);
});

check("previewStatBonus: secondary caps at the descriptor's secondaryMax", () => {
  const preview = previewStatBonus("discipline", 200);
  assert.equal(preview.current.secondary, statDescriptor("discipline").secondaryMax);
});

check("previewStatBonus: handles 0 level without negative numbers", () => {
  const preview = previewStatBonus("sword", 0);
  assert.equal(preview.current.primary, 0);
  assert.equal(preview.next.primary, 1);
});

// ---------------------------------------------------------------------------
// New: fatigueImpact
// ---------------------------------------------------------------------------

check("fatigueImpact: low fatigue has no penalty", () => {
  const fresh = fatigueImpact(0);
  assert.equal(fresh.label, "fresco");
  assert.equal(fresh.xpPenaltyPct, 0);
  assert.equal(fresh.timePenaltyPct, 0);
});

check("fatigueImpact: 75 triggers agotado with -18% XP / -8% time", () => {
  const tired = fatigueImpact(80);
  assert.equal(tired.label, "agotado");
  assert.equal(tired.xpPenaltyPct, 18);
  assert.equal(tired.timePenaltyPct, 8);
});

check("fatigueImpact: 90+ triggers roto with -25% XP / -12% time", () => {
  const broken = fatigueImpact(95);
  assert.equal(broken.label, "roto");
  assert.equal(broken.xpPenaltyPct, 25);
  assert.equal(broken.timePenaltyPct, 12);
});

check("fatigueImpact: 50-74 is cansado with mild penalty", () => {
  const mid = fatigueImpact(60);
  assert.equal(mid.label, "cansado");
  assert.equal(mid.xpPenaltyPct, 8);
});

// ---------------------------------------------------------------------------
// New: recommendTraining
// ---------------------------------------------------------------------------

check("recommendTraining: returns 3 stats, sorted by deficit", () => {
  const state = withStat(createTestState(), "command", 0);
  const recs = recommendTraining(state.characters[0], 3);
  assert.equal(recs.length, 3);
  // sorted descending by deficit
  for (let i = 1; i < recs.length; i++) {
    assert.ok(recs[i - 1].deficit >= recs[i].deficit);
  }
});

check("recommendTraining: zeroed stat is always first for that role", () => {
  const state = withStat(createTestState(), "pike", 0);
  const recs = recommendTraining(state.characters[0], 3);
  // pike has weight 1.4 for piquero; 0 < 14 target => big deficit
  assert.equal(recs[0].stat, "pike");
});

// ---------------------------------------------------------------------------
// New: boost helpers
// ---------------------------------------------------------------------------

check("boostCostFor: 5x base coins and +2 fatigue over base", () => {
  const option = { cost: { coins: 8, xp: 0 }, fatigue: 3 } as never;
  const cost = boostCostFor(option);
  assert.equal(cost.coins, 40);
  assert.equal(cost.fatigue, 5);
});

check("isBoostMilestone: first 10 levels are always boostable, then every 5", () => {
  assert.equal(isBoostMilestone(0), true);
  assert.equal(isBoostMilestone(9), true);
  assert.equal(isBoostMilestone(10), true);
  assert.equal(isBoostMilestone(11), false);
  assert.equal(isBoostMilestone(15), true);
  assert.equal(isBoostMilestone(20), true);
  assert.equal(isBoostMilestone(23), false);
});

// ---------------------------------------------------------------------------
// New: stat coverage — every StatId in StatId[] has a descriptor
// ---------------------------------------------------------------------------

check("statDescriptor: every stat id resolves to a descriptor", () => {
  const ids: StatId[] = ["pike", "sword", "arquebus", "discipline", "vigor", "cunning", "command"];
  for (const id of ids) {
    const desc = statDescriptor(id);
    assert.ok(desc.primary.length > 0, `${id} has a primary label`);
    assert.ok(desc.secondary.length > 0, `${id} has a secondary label`);
    assert.ok(desc.primaryPerLevel > 0);
  }
});

console.log(JSON.stringify({ ok: true, checked: "training", cases: casesRun }, null, 2));
