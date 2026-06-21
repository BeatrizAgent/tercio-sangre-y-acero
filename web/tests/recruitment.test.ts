import assert from "node:assert/strict";
import { createInitialState } from "../src/lib/game-store";
import {
  canRecruitCandidate,
  recruitCandidateInState,
} from "../src/lib/domain/recruitment";
import {
  candidateAffordability,
  candidateCostLabel,
  candidatePowerScore,
  candidateTotalCost,
  filterCandidatesByRole,
  recruitmentCandidates,
  sortCandidates,
  uniqueRolesFromCandidates,
} from "../src/lib/data/recruitment";

const base = createInitialState();

const paid = recruitmentCandidates.find((candidate) => candidate.id === "tomas_de_orduna");
assert.ok(paid, "paid candidate exists");
assert.equal(canRecruitCandidate(base.soldier, paid).ok, true);

const paidResult = recruitCandidateInState(base, paid.id);
assert.equal(paidResult.result.ok, true);
assert.equal(paidResult.next.soldier.coins, base.soldier.coins - (paid.cost.coins ?? 0));
assert.equal(paidResult.next.characters.some((character) => character.id === paid.character.id), true);
assert.equal(
  paidResult.next.characters.find((character) => character.id === paid.character.id)?.formationSlot,
  "banquillo",
);

const duplicateResult = recruitCandidateInState(paidResult.next, paid.id);
assert.equal(duplicateResult.result.ok, false);
assert.equal(duplicateResult.result.message, "Ya está en tu tercio.");

const honor = recruitmentCandidates.find((candidate) => candidate.id === "hernan_de_ula");
assert.ok(honor, "honor candidate exists");
assert.equal(canRecruitCandidate(base.soldier, honor).ok, false);
assert.equal(canRecruitCandidate({ ...base.soldier, honor: honor.cost.honor ?? 0 }, honor).ok, true);

const fame = recruitmentCandidates.find((candidate) => candidate.id === "beltran_de_rojas");
assert.ok(fame, "fame candidate exists");
assert.equal(canRecruitCandidate(base.soldier, fame).ok, false);
assert.equal(canRecruitCandidate({ ...base.soldier, reputation: fame.cost.reputation ?? 0 }, fame).ok, true);

// candidatePowerScore: sum of all stats
for (const candidate of recruitmentCandidates) {
  const expected = Object.values(candidate.character.stats).reduce((sum, value) => sum + (value ?? 0), 0);
  assert.equal(candidatePowerScore(candidate), expected, `power score for ${candidate.id}`);
}
const sargento = recruitmentCandidates.find((c) => c.id === "rodrigo_de_soria");
assert.ok(sargento);
assert.ok(
  candidatePowerScore(sargento) > candidatePowerScore(paid),
  "sargento has more power than bisono",
);

// candidateTotalCost: weighted cost (coins + honor*5 + reputation*3)
for (const candidate of recruitmentCandidates) {
  const expected = (candidate.cost.coins ?? 0) + (candidate.cost.honor ?? 0) * 5 + (candidate.cost.reputation ?? 0) * 3;
  assert.equal(candidateTotalCost(candidate), expected, `total cost for ${candidate.id}`);
}
const tde = recruitmentCandidates.find((c) => c.id === "tomas_de_orduna");
assert.ok(tde);
assert.ok(candidateTotalCost(sargento) > candidateTotalCost(tde), "sargento costs more than tomás");

// candidateCostLabel: human readable cost
assert.equal(candidateCostLabel(paid), "18 doblones");
assert.equal(candidateCostLabel(honor), "2 honor");
assert.equal(candidateCostLabel(fame), "4 fama");
assert.equal(candidateCostLabel(sargento), "36 doblones + 3 honor + 2 fama");

// candidateAffordability: missing vs can afford
const rich = { ...base.soldier, coins: 100, honor: 100, reputation: 100 };
for (const candidate of recruitmentCandidates) {
  assert.equal(
    candidateAffordability(rich, candidate).canAfford,
    true,
    `rich can afford ${candidate.id}`,
  );
  assert.deepEqual(
    candidateAffordability(rich, candidate).missing,
    { coins: 0, honor: 0, reputation: 0 },
    `no missing for rich on ${candidate.id}`,
  );
}
const broke = { ...base.soldier, coins: 0, honor: 0, reputation: 0 };
const brokePaid = candidateAffordability(broke, paid);
assert.equal(brokePaid.canAfford, false);
assert.equal(brokePaid.missing.coins, 18);
assert.equal(brokePaid.missing.honor, 0);
assert.equal(brokePaid.missing.reputation, 0);
const brokeHonor = candidateAffordability(broke, honor);
assert.equal(brokeHonor.missing.honor, 2);
const brokeFame = candidateAffordability(broke, fame);
assert.equal(brokeFame.missing.reputation, 4);

// filterCandidatesByRole: all / specific / missing
assert.equal(filterCandidatesByRole(recruitmentCandidates, "all").length, recruitmentCandidates.length);
const piqueros = filterCandidatesByRole(recruitmentCandidates, "Piquero");
assert.equal(piqueros.length, 1);
assert.equal(piqueros[0].id, "tomas_de_orduna");
assert.equal(filterCandidatesByRole(recruitmentCandidates, "Inexistente").length, 0);

// sortCandidates: power desc, cost asc, name asc
const byPower = sortCandidates(recruitmentCandidates, "power");
const powerScores = byPower.map(candidatePowerScore);
for (let i = 1; i < powerScores.length; i++) {
  assert.ok(powerScores[i - 1] >= powerScores[i], `power desc at index ${i}`);
}
const byCost = sortCandidates(recruitmentCandidates, "cost");
const costScores = byCost.map(candidateTotalCost);
for (let i = 1; i < costScores.length; i++) {
  assert.ok(costScores[i - 1] <= costScores[i], `cost asc at index ${i}`);
}
const byName = sortCandidates(recruitmentCandidates, "name");
const names = byName.map((c) => c.character.name);
const sortedNames = [...names].sort((a, b) => a.localeCompare(b, "es"));
assert.deepEqual(names, sortedNames, "name asc locale es");

// uniqueRolesFromCandidates
const roles = uniqueRolesFromCandidates(recruitmentCandidates);
assert.ok(roles.includes("Piquero"));
assert.ok(roles.includes("Arcabucero"));
assert.ok(roles.includes("Sargento"));
assert.equal(new Set(roles).size, roles.length, "roles are unique");

console.log(JSON.stringify({ ok: true, checked: recruitmentCandidates.length }, null, 2));
