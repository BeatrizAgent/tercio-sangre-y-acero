import { createCharacterStates } from "../data/characters";
import { recruitmentCandidates } from "../data/recruitment";
import type { CharacterState, GameState, Soldier } from "../types";

export const PLAYER_CHARACTER_ID = "diego_de_arce";

export function createPlayerCharacterState(soldier: Soldier): CharacterState {
  const template =
    createCharacterStates().find((character) => character.id === PLAYER_CHARACTER_ID) ??
    createCharacterStates().find((character) => character.name === "Diego de Arce") ??
    createCharacterStates()[0];

  return {
    ...template,
    id: PLAYER_CHARACTER_ID,
    name: soldier.name,
    rank: soldier.rank,
    fatigue: soldier.fatigue,
    stats: { ...soldier.stats },
    equipment: { ...soldier.equipment },
    portraitAssetId: soldier.portraitAssetId ?? template?.portraitAssetId ?? "asset_portrait_piquero_001",
    formationSlot: "vanguardia",
    unlocked: true,
  };
}

export function createInitialRoster(soldier: Soldier): CharacterState[] {
  return [createPlayerCharacterState(soldier)];
}

export function normalizePlayableRoster(state: GameState): CharacterState[] {
  const candidateIds = new Set(recruitmentCandidates.map((candidate) => candidate.character.id));
  const seen = new Set<string>();
  const roster: CharacterState[] = [createPlayerCharacterState(state.soldier)];
  seen.add(PLAYER_CHARACTER_ID);

  for (const character of state.characters ?? []) {
    if (character.id === PLAYER_CHARACTER_ID) continue;
    if (!candidateIds.has(character.id)) continue;
    if (seen.has(character.id)) continue;
    roster.push({ ...character, unlocked: true });
    seen.add(character.id);
  }

  return roster;
}

export function normalizeActiveCharacterId(state: Pick<GameState, "activeCharacterId">, roster: readonly CharacterState[]) {
  return roster.some((character) => character.id === state.activeCharacterId)
    ? state.activeCharacterId
    : PLAYER_CHARACTER_ID;
}
