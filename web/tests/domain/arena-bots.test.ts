import assert from "node:assert/strict";
import { buildArenaBotStats, getArenaBotTargetLevel, mapArenaBotToOpponent } from "../../src/lib/domain/arena-bots";

assert.equal(getArenaBotTargetLevel({ averageRealLevel: 10, seedOffset: -2 }), 8, "negative offset lowers target level");
assert.equal(getArenaBotTargetLevel({ averageRealLevel: 1, seedOffset: -5 }), 1, "target level never drops below one");

const stats = buildArenaBotStats({ targetLevel: 12, seedOffset: 2 });
assert.ok(stats.pike >= 4, "pike scales with level");
assert.ok(stats.discipline >= 4, "discipline scales with level");

const opponent = mapArenaBotToOpponent({
  soldier: {
    id: "soldier_bot_1",
    name: "Iñigo Bot",
    rank: "cabo",
    xp: 900,
    fatigue: 0,
    portraitAssetId: "asset_enemy_oficial_001",
    stats,
  },
  profile: {
    style: "Pica baja y paciencia.",
    description: "Bot DB.",
    seedOffset: 2,
  },
});

assert.equal(opponent.soldierId, "soldier_bot_1", "opponent keeps soldier id");
assert.equal(opponent.level, 10, "opponent level derives from xp");
assert.ok(opponent.power > 0, "opponent has computed power");
assert.ok(opponent.rewards.xp >= 6, "opponent rewards scale");

console.log(JSON.stringify({ ok: true, checked: "arena-bots" }, null, 2));
