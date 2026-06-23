// Pure recruitment math: validate cost + uniqueness, add the candidate to
// the company.

import { getRecruitmentCandidate, recruitmentCandidates, type RecruitmentCandidate } from "../data/recruitment";
import { fail, ok, type ActionResult } from "./result";
import type { GameState, Soldier } from "../types";

const PLAYER_CHARACTER_ID = "diego_de_arce";
const RECRUIT_UNLOCK_LEVELS = [5, 10, 20, 30, 50] as const;

export function getSoldierLevel(xp: number): number {
  return Math.max(1, Math.floor(Math.max(0, xp) / 100) + 1);
}

export function getRecruitSlotLimit(level: number): number {
  return RECRUIT_UNLOCK_LEVELS.filter((unlockLevel) => level >= unlockLevel).length;
}

export function getNextRecruitUnlockLevel(level: number): number | null {
  return RECRUIT_UNLOCK_LEVELS.find((unlockLevel) => level < unlockLevel) ?? null;
}

export function countExternalRecruits(state: GameState): number {
  const recruitIds = new Set(recruitmentCandidates.map((candidate) => candidate.character.id));
  return state.characters.filter(
    (character) => character.id !== PLAYER_CHARACTER_ID && recruitIds.has(character.id),
  ).length;
}

function recruitSlotMessage(level: number) {
  const nextUnlock = getNextRecruitUnlockLevel(level);
  if (nextUnlock === 5) return "Alcanza nivel 5 para desbloquear el primer recluta.";
  if (nextUnlock) return `Cupo de reclutas lleno hasta nivel ${nextUnlock}.`;
  return "Cupo maximo de 5 reclutas alcanzado.";
}

export function canRecruitCandidate(
  soldier: Soldier,
  candidate: RecruitmentCandidate,
  currentRecruitCount = 0,
): { ok: boolean; message: string } {
  const level = getSoldierLevel(soldier.xp);
  const slotLimit = getRecruitSlotLimit(level);
  if (currentRecruitCount >= slotLimit) {
    return { ok: false, message: recruitSlotMessage(level) };
  }

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
  const check = canRecruitCandidate(state.soldier, candidate, countExternalRecruits(state));
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
