import assert from "node:assert/strict";
import { createInitialState } from "../src/lib/game-store";
import {
  canRecruitCandidate,
  recruitCandidateInState,
} from "../src/lib/domain/recruitment";
import { recruitmentCandidates } from "../src/lib/data/recruitment";

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

console.log(JSON.stringify({ ok: true, checked: recruitmentCandidates.length }, null, 2));
