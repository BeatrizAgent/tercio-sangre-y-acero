// CharacterState fixtures: builds a CharacterState with known stats so
// formation tests can drive getFitState / isNCOInStress without depending
// on the catalog.

import type { CharacterState, FormationSlot, Stats } from "../../src/lib/types";

const emptyEquipment: CharacterState["equipment"] = {
  head: null,
  body: null,
  mainHand: null,
  offHand: null,
  firearm: null,
  accessory: null,
  boots: null,
  consumable: null,
};

export interface MakeCharacterOptions {
  id?: string;
  name?: string;
  role?: string;
  rank?: string;
  portraitAssetId?: string;
  formationSlot?: FormationSlot;
  fatigue?: number;
  stats?: Partial<Stats>;
  unlocked?: boolean;
}

export function makeCharacterState(options: MakeCharacterOptions = {}): CharacterState {
  const baseStats: Stats = {
    pike: 1,
    sword: 1,
    arquebus: 1,
    discipline: 1,
    vigor: 1,
    cunning: 1,
    command: 0,
  };
  return {
    id: options.id ?? "char_test_001",
    name: options.name ?? "Test Soldier",
    role: options.role ?? "Piquero",
    rank: options.rank ?? "bisono",
    portraitAssetId: options.portraitAssetId ?? "asset_portrait_piquero_001",
    formationSlot: options.formationSlot ?? "banquillo",
    fatigue: options.fatigue ?? 0,
    stats: { ...baseStats, ...(options.stats ?? {}) },
    equipment: { ...emptyEquipment },
    unlocked: options.unlocked ?? true,
  };
}
