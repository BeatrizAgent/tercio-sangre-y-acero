import assert from "node:assert/strict";
import { mapSoldierToPublicPlayerProfile, sortPublicPlayerProfiles } from "../../src/lib/domain/player-profiles";

const diego = mapSoldierToPublicPlayerProfile({
  id: "soldier_real_1",
  name: "Diego de Arce",
  rank: "bisono",
  honor: 40,
  xp: 240,
  fatigue: 12,
  reputation: 3,
  portraitAssetId: "portrait_diego",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  stats: {
    pike: 2,
    sword: 1,
    arquebus: 1,
    discipline: 2,
    vigor: 2,
    cunning: 1,
    command: 0,
  },
  equipment: {
    head: null,
    body: "jubon_viejo",
    mainHand: "pica_rota",
    offHand: null,
    firearm: null,
    accessory: null,
    boots: null,
    consumable: null,
  },
  wounds: [{ id: "wound_1", treated: false }, { id: "wound_2", treated: true }],
  missionResults: [{ id: "mission_1", success: true }],
  arenaResults: [{ id: "arena_1", success: false }, { id: "arena_2", success: true }],
});

assert.equal(diego.id, "soldier_real_1");
assert.equal(diego.level, 3);
assert.equal(diego.rankName, "Bisoño");
assert.equal(diego.openWounds, 1);
assert.equal(diego.missionCount, 1);
assert.equal(diego.arenaWins, 1);
assert.equal(diego.arenaLosses, 1);
assert.deepEqual(Object.keys(diego.equipment).sort(), ["body", "mainHand"].sort());
assert.equal("coins" in diego, false, "public profile does not expose coins");
assert.equal("inventory" in diego, false, "public profile does not expose inventory");

const ordered = sortPublicPlayerProfiles([
  { ...diego, id: "low", honor: 1, xp: 100 },
  { ...diego, id: "top", honor: 20, xp: 0 },
  { ...diego, id: "mid", honor: 20, xp: 500 },
]);

assert.deepEqual(ordered.map((player) => player.id), ["mid", "top", "low"]);

console.log(JSON.stringify({ ok: true, checked: "player-profiles" }, null, 2));
