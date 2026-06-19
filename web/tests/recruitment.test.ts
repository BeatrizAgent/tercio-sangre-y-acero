import assert from "node:assert/strict";
import { createInitialState } from "../src/lib/game-store";
import {
  canRecruitCandidate,
  recruitCandidateIntoState,
  recruitmentCandidates,
} from "../src/lib/recruitment";

const base = createInitialState();

const paid = recruitmentCandidates.find((candidate) => candidate.id === "tomas_de_orduna");
assert.ok(paid, "paid candidate exists");
assert.equal(canRecruitCandidate(base.soldier, paid).ok, true);

const paidResult = recruitCandidateIntoState(base, paid.id);
assert.equal(paidResult.ok, true);
assert.equal(paidResult.state.soldier.coins, base.soldier.coins - (paid.cost.coins ?? 0));
assert.equal(paidResult.state.characters.some((character) => character.id === paid.character.id), true);
assert.equal(
  paidResult.state.characters.find((character) => character.id === paid.character.id)?.formationSlot,
  "banquillo",
);

const duplicateResult = recruitCandidateIntoState(paidResult.state, paid.id);
assert.equal(duplicateResult.ok, false);
assert.equal(duplicateResult.message, "Ya esta en tu tercio.");

const honor = recruitmentCandidates.find((candidate) => candidate.id === "hernan_de_ula");
assert.ok(honor, "honor candidate exists");
assert.equal(canRecruitCandidate(base.soldier, honor).ok, false);
assert.equal(canRecruitCandidate({ ...base.soldier, honor: honor.cost.honor ?? 0 }, honor).ok, true);

const fame = recruitmentCandidates.find((candidate) => candidate.id === "beltran_de_rojas");
assert.ok(fame, "fame candidate exists");
assert.equal(canRecruitCandidate(base.soldier, fame).ok, false);
assert.equal(canRecruitCandidate({ ...base.soldier, reputation: fame.cost.reputation ?? 0 }, fame).ok, true);

console.log(JSON.stringify({ ok: true, checked: recruitmentCandidates.length }, null, 2));
