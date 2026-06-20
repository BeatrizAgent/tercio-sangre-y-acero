// Pure recruitment math: validate cost + uniqueness, add the candidate to
// the company.

import { getRecruitmentCandidate, recruitmentCandidates, type RecruitmentCandidate } from "../data/recruitment";
import { fail, ok, type ActionResult } from "./result";
import type { GameState, Soldier } from "../types";

export function canRecruitCandidate(
  soldier: Soldier,
  candidate: RecruitmentCandidate,
): { ok: boolean; message: string } {
  const missing: string[] = [];
  if ((candidate.cost.coins ?? 0) > soldier.coins) missing.push("dinero");
  if ((candidate.cost.honor ?? 0) > soldier.honor) missing.push("honor");
  if ((candidate.cost.reputation ?? 0) > soldier.reputation) missing.push("fama");

  if (missing.length > 0) {
    return { ok: false, message: `Falta ${missing.join(", ")}.` };
  }
  return { ok: true, message: "Puede reclutarse." };
}

export function recruitCandidateInState(
  state: GameState,
  candidateId: string,
): { next: GameState; result: ActionResult } {
  const candidate = getRecruitmentCandidate(candidateId);
  if (!candidate) return { next: state, result: fail("Recluta no encontrado.") };
  if (state.characters.some((character) => character.id === candidate.character.id)) {
    return { next: state, result: fail("Ya está en tu tercio.") };
  }
  const check = canRecruitCandidate(state.soldier, candidate);
  if (!check.ok) return { next: state, result: fail(check.message) };

  return {
    next: {
      ...state,
      soldier: {
        ...state.soldier,
        coins: state.soldier.coins - (candidate.cost.coins ?? 0),
        honor: state.soldier.honor - (candidate.cost.honor ?? 0),
        reputation: state.soldier.reputation - (candidate.cost.reputation ?? 0),
      },
      characters: [
        ...state.characters,
        {
          ...candidate.character,
          formationSlot: "banquillo" as const,
          stats: { ...candidate.character.stats },
          equipment: { ...candidate.character.equipment },
          unlocked: true,
        },
      ],
    },
    result: ok(`${candidate.character.name} entra en el tercio.`),
  };
}

// Backwards-compatible re-exports.
export { recruitmentCandidates, getRecruitmentCandidate };
