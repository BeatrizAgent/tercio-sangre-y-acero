// Recruitment candidates and cost metadata. The state-mutating logic
// (canRecruitCandidate, recruitCandidateIntoState) lives in
// `lib/domain/recruitment.ts` so the data file stays read-only.

import type { CharacterDefinition, RecruitmentCandidate, RecruitmentCost } from "../types";

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
      portraitAssetId: "diego_de_arce_portrait",
      tercioAssetId: "tercio_001",
      emotionAssetId: "tercio_emocion_001",
      formationSlot: "banquillo",
      fatigue: 6,
      stats: { pike: 3, sword: 1, arquebus: 0, discipline: 2, vigor: 3, cunning: 1, command: 0 },
      equipment: emptyEquipment,
    },
  },
  {
    id: "bruno_de_alarcon",
    hook: "Vino y dos dedos de arcabuz corto, nada de mosquete.",
    cost: { coins: 26 },
    character: {
      id: "bruno_de_alarcon",
      name: "Bruno de Alarcon",
      role: "Tirador",
      rank: "bisono",
      portraitAssetId: "diego_de_arce_portrait",
      tercioAssetId: "tercio_001",
      emotionAssetId: "tercio_emocion_001",
      formationSlot: "banquillo",
      fatigue: 4,
      stats: { pike: 1, sword: 1, arquebus: 3, discipline: 2, vigor: 2, cunning: 2, command: 0 },
      equipment: emptyEquipment,
    },
  },
  {
    id: "luisa_de_ayala",
    hook: "Cura heridas por monedas o por comida. No regatea.",
    cost: { coins: 32, honor: 1 },
    character: {
      id: "luisa_de_ayala",
      name: "Luisa de Ayala",
      role: "Asistente",
      rank: "bisono",
      portraitAssetId: "diego_de_arce_portrait",
      tercioAssetId: "tercio_001",
      emotionAssetId: "tercio_emocion_001",
      formationSlot: "banquillo",
      fatigue: 3,
      stats: { pike: 1, sword: 2, arquebus: 1, discipline: 2, vigor: 2, cunning: 3, command: 1 },
      equipment: emptyEquipment,
    },
  },
  {
    id: "garcilaso_de_vega",
    hook: "Jinete ligero, prefiere evitar el barro profundo.",
    cost: { coins: 28 },
    character: {
      id: "garcilaso_de_vega",
      name: "Garcilaso de Vega",
      role: "Jinete",
      rank: "bisono",
      portraitAssetId: "diego_de_arce_portrait",
      tercioAssetId: "tercio_001",
      emotionAssetId: "tercio_emocion_001",
      formationSlot: "banquillo",
      fatigue: 5,
      stats: { pike: 2, sword: 2, arquebus: 1, discipline: 2, vigor: 3, cunning: 2, command: 0 },
      equipment: emptyEquipment,
    },
  },
  {
    id: "hernan_lopez",
    hook: "Carga todo: escudo, pica y cantimplora.",
    cost: { coins: 22 },
    character: {
      id: "hernan_lopez",
      name: "Hernan Lopez",
      role: "Gastador",
      rank: "bisono",
      portraitAssetId: "diego_de_arce_portrait",
      tercioAssetId: "tercio_001",
      emotionAssetId: "tercio_emocion_001",
      formationSlot: "banquillo",
      fatigue: 7,
      stats: { pike: 2, sword: 2, arquebus: 0, discipline: 3, vigor: 4, cunning: 1, command: 0 },
      equipment: emptyEquipment,
    },
  },
];
