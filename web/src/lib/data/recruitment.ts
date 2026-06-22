// Recruitment candidates and cost metadata. The state-mutating logic
// (canRecruitCandidate, recruitCandidateIntoState) lives in
// `lib/domain/recruitment.ts` so the data file stays read-only.
//
// Pure helpers (powerScore, affordability, filter, sort) also live here so
// the page and the new card component can read the same numbers without
// duplicating arithmetic.

import type {
  CharacterDefinition,
  RecruitmentCandidate,
  RecruitmentCost,
  Soldier,
} from "../types";

export type { RecruitmentCandidate, RecruitmentCost };

const emptyEquipment: CharacterDefinition["equipment"] = {
  head: null,
  body: null,
  mainHand: null,
  offHand: null,
  firearm: null,
  accessory: null,
  boots: null,
  consumable: null,
};

export const recruitmentCandidates: readonly RecruitmentCandidate[] = [
  {
    id: "tomas_de_orduna",
    hook: "Pide paga corta y sitio lejos del tambor.",
    cost: { coins: 18 },
    character: {
      id: "tomas_de_orduna",
      name: "Tomas de Orduna",
      role: "Piquero",
      rank: "bisono",
      portraitAssetId: "asset_portrait_recluta_joven_001",
      formationSlot: "banquillo",
      fatigue: 6,
      stats: { pike: 3, sword: 1, arquebus: 0, discipline: 2, vigor: 3, cunning: 1, command: 0 },
      equipment: { ...emptyEquipment, mainHand: "weapon_pica_gastada_001" },
    },
  },
  {
    id: "hernan_de_ula",
    hook: "Veterano seco. Solo sirve a capitan con honra visible.",
    cost: { honor: 2 },
    character: {
      id: "hernan_de_ula",
      name: "Hernan de Ula",
      role: "Cabo viejo",
      rank: "soldado_viejo",
      portraitAssetId: "asset_portrait_veterano_001",
      formationSlot: "banquillo",
      fatigue: 14,
      stats: { pike: 5, sword: 3, arquebus: 1, discipline: 5, vigor: 4, cunning: 2, command: 2 },
      equipment: { ...emptyEquipment, mainHand: "weapon_pica_corta_001" },
    },
  },
  {
    id: "beltran_de_rojas",
    hook: "Viene por tu fama, no por tu bolsa.",
    cost: { reputation: 4 },
    character: {
      id: "beltran_de_rojas",
      name: "Beltran de Rojas",
      role: "Espadachin",
      rank: "soldado",
      portraitAssetId: "asset_portrait_piquero_001",
      formationSlot: "banquillo",
      fatigue: 9,
      stats: { pike: 2, sword: 5, arquebus: 1, discipline: 3, vigor: 4, cunning: 3, command: 1 },
      equipment: { ...emptyEquipment, mainHand: "weapon_ropera_ronosa_001" },
    },
  },
  {
    id: "mateo_de_breda",
    hook: "Arcabucero con polvora propia y deudas ajenas.",
    cost: { coins: 24, reputation: 1 },
    character: {
      id: "mateo_de_breda",
      name: "Mateo de Breda",
      role: "Arcabucero",
      rank: "soldado",
      portraitAssetId: "asset_portrait_arcabucero_001",
      formationSlot: "banquillo",
      fatigue: 11,
      stats: { pike: 1, sword: 2, arquebus: 6, discipline: 3, vigor: 2, cunning: 4, command: 1 },
      equipment: { ...emptyEquipment, firearm: "weapon_mecha_001" },
    },
  },
  {
    id: "julian_de_napoles",
    hook: "Buen ojo para vendas, agua y malas noticias.",
    cost: { coins: 12, honor: 1 },
    character: {
      id: "julian_de_napoles",
      name: "Julian de Napoles",
      role: "Ayudante",
      rank: "bisono",
      portraitAssetId: "asset_portrait_cirujano_001",
      formationSlot: "banquillo",
      fatigue: 4,
      stats: { pike: 1, sword: 1, arquebus: 1, discipline: 4, vigor: 2, cunning: 4, command: 0 },
      equipment: { ...emptyEquipment, consumable: "consumable_vendas_001" },
    },
  },
  {
    id: "rodrigo_de_soria",
    hook: "Quiere soldada, respeto y fila lejos del barro hondo.",
    cost: { coins: 36, honor: 3, reputation: 2 },
    character: {
      id: "rodrigo_de_soria",
      name: "Rodrigo de Soria",
      role: "Sargento",
      rank: "sargento",
      portraitAssetId: "asset_portrait_sargento_001",
      formationSlot: "banquillo",
      fatigue: 10,
      stats: { pike: 4, sword: 4, arquebus: 2, discipline: 6, vigor: 4, cunning: 3, command: 5 },
      equipment: { ...emptyEquipment, mainHand: "weapon_ropera_ronosa_001" },
    },
  },
] as const;

export function getRecruitmentCandidate(candidateId: string) {
  return recruitmentCandidates.find((candidate) => candidate.id === candidateId);
}

export type RecruitmentSortMode = "power" | "cost" | "name";

export interface AffordabilityBreakdown {
  canAfford: boolean;
  missing: { coins: number; honor: number; reputation: number };
}

export function candidatePowerScore(candidate: RecruitmentCandidate): number {
  return Object.values(candidate.character.stats).reduce(
    (sum, value) => sum + (value ?? 0),
    0,
  );
}

export function candidateTotalCost(candidate: RecruitmentCandidate): number {
  const coins = candidate.cost.coins ?? 0;
  const honor = candidate.cost.honor ?? 0;
  const reputation = candidate.cost.reputation ?? 0;
  return coins + honor * 5 + reputation * 3;
}

export function candidateCostLabel(candidate: RecruitmentCandidate): string {
  const parts: string[] = [];
  if (candidate.cost.coins) parts.push(`${candidate.cost.coins} doblones`);
  if (candidate.cost.honor) parts.push(`${candidate.cost.honor} honor`);
  if (candidate.cost.reputation) parts.push(`${candidate.cost.reputation} fama`);
  return parts.length > 0 ? parts.join(" + ") : "Gratis";
}

export function candidateAffordability(
  soldier: Soldier,
  candidate: RecruitmentCandidate,
): AffordabilityBreakdown {
  const needCoins = candidate.cost.coins ?? 0;
  const needHonor = candidate.cost.honor ?? 0;
  const needRep = candidate.cost.reputation ?? 0;
  const missing = {
    coins: Math.max(0, needCoins - soldier.coins),
    honor: Math.max(0, needHonor - soldier.honor),
    reputation: Math.max(0, needRep - soldier.reputation),
  };
  return {
    canAfford: missing.coins === 0 && missing.honor === 0 && missing.reputation === 0,
    missing,
  };
}

export function filterCandidatesByRole(
  candidates: readonly RecruitmentCandidate[],
  role: string | "all",
): readonly RecruitmentCandidate[] {
  if (!role || role === "all") return candidates;
  return candidates.filter((candidate) => candidate.character.role === role);
}

export function sortCandidates(
  candidates: readonly RecruitmentCandidate[],
  mode: RecruitmentSortMode,
): readonly RecruitmentCandidate[] {
  const arr = [...candidates];
  if (mode === "power") {
    arr.sort((a, b) => candidatePowerScore(b) - candidatePowerScore(a));
  } else if (mode === "cost") {
    arr.sort((a, b) => candidateTotalCost(a) - candidateTotalCost(b));
  } else {
    arr.sort((a, b) => a.character.name.localeCompare(b.character.name, "es"));
  }
  return arr;
}

export function uniqueRolesFromCandidates(
  candidates: readonly RecruitmentCandidate[],
): string[] {
  return Array.from(new Set(candidates.map((candidate) => candidate.character.role)));
}
