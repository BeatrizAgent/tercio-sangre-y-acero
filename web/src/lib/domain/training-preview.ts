// Training preview helpers.
// Pure functions that answer three questions the /training page needs:
//   1. What does this stat actually give me at level N? (previewStatBonus)
//   2. Which stats should I train next, given my role? (recommendTraining)
//   3. How much does my current fatigue hurt my training? (fatigueImpact)
//
// Bonuses are declarative and aligned with the in-game copy in the
// mockup (DESIGN/entrenamiento.png). When real combat formulas land
// in `domain/character-bonuses.ts`, replace the constants in
// `STAT_SCALING` and keep these helpers as the UI's single entry
// point so the page never has to know the math.

import type { CharacterState, StatId, Stats } from "../types";

export interface StatBonusDescriptor {
  primary: string;
  secondary: string;
  primaryPerLevel: number;
  secondaryPerLevel: number;
  secondaryMax: number;
}

const STAT_SCALING: Record<StatId, StatBonusDescriptor> = {
  pike: {
    primary: "Daño con picas",
    secondary: "Defensa en formación",
    primaryPerLevel: 1,
    secondaryPerLevel: 0.15,
    secondaryMax: 25,
  },
  sword: {
    primary: "Daño con espada",
    secondary: "Prob. de desmenuzar",
    primaryPerLevel: 1,
    secondaryPerLevel: 0.15,
    secondaryMax: 25,
  },
  arquebus: {
    primary: "Daño a distancia",
    secondary: "Velocidad de recarga",
    primaryPerLevel: 1,
    secondaryPerLevel: 0.2,
    secondaryMax: 25,
  },
  discipline: {
    primary: "Disciplina",
    secondary: "Coste de fatiga en combate",
    primaryPerLevel: 1,
    secondaryPerLevel: 0.1,
    secondaryMax: 10,
  },
  vigor: {
    primary: "Salud máxima",
    secondary: "Resistencia al cansancio",
    primaryPerLevel: 2,
    secondaryPerLevel: 0.2,
    secondaryMax: 25,
  },
  cunning: {
    primary: "Prob. de crítico",
    secondary: "Experiencia obtenida",
    primaryPerLevel: 0.8,
    secondaryPerLevel: 0.18,
    secondaryMax: 25,
  },
  command: {
    primary: "Liderazgo",
    secondary: "Moral de la compañía",
    primaryPerLevel: 1,
    secondaryPerLevel: 0.2,
    secondaryMax: 25,
  },
};

export const STAT_LABELS: Record<StatId, string> = {
  pike: "Pica",
  sword: "Espada",
  arquebus: "Arcabuz",
  discipline: "Disciplina",
  vigor: "Vigor",
  cunning: "Astucia",
  command: "Mando",
};

export const STAT_FLAVOR: Record<StatId, string> = {
  pike: "Formación cerrada, hombros duros, asta firme.",
  sword: "Patio de armas, acero romo, golpes repetidos.",
  arquebus: "Mecha, pólvora húmeda y pulso paciente.",
  discipline: "Orden, castigo, obediencia bajo barro.",
  vigor: "Marcha cargada, hambre, lluvia y botas rotas.",
  cunning: "Lectura del terreno y trato con gente torcida.",
  command: "Voz de mando, estandarte alto, hombres cansados.",
};

export function statDescriptor(stat: StatId): StatBonusDescriptor {
  return STAT_SCALING[stat];
}

export interface BonusBreakdown {
  primary: number;
  secondary: number;
  primaryText: string;
  secondaryText: string;
}

function breakdownFor(stat: StatId, level: number): BonusBreakdown {
  const desc = STAT_SCALING[stat];
  const primary = Math.round(desc.primaryPerLevel * level);
  const secondary = Math.min(desc.secondaryMax, Number((desc.secondaryPerLevel * level).toFixed(1)));
  const sign = "+";
  return {
    primary,
    secondary,
    primaryText: `${sign}${primary} ${desc.primary}`,
    secondaryText: `${sign}${secondary}% ${desc.secondary}`,
  };
}

export interface StatBonusPreview {
  current: BonusBreakdown;
  next: BonusBreakdown;
  nextLevel: number;
}

export function previewStatBonus(stat: StatId, currentLevel: number): StatBonusPreview {
  const safeLevel = Math.max(0, Math.floor(currentLevel));
  return {
    current: breakdownFor(stat, safeLevel),
    next: breakdownFor(stat, safeLevel + 1),
    nextLevel: safeLevel + 1,
  };
}

export interface FatigueImpact {
  label: "fresco" | "cansado" | "agotado" | "roto";
  xpPenaltyPct: number;
  timePenaltyPct: number;
  reason: string;
}

export function fatigueImpact(value: number): FatigueImpact {
  if (value >= 90) {
    return {
      label: "roto",
      xpPenaltyPct: 25,
      timePenaltyPct: 12,
      reason: "Herida abierta en cualquier escaramuza. El sargento te mirará antes de enviarte.",
    };
  }
  if (value >= 75) {
    return {
      label: "agotado",
      xpPenaltyPct: 18,
      timePenaltyPct: 8,
      reason: "Respiras con peso, las piernas fallan, la paga no compensa la carniza.",
    };
  }
  if (value >= 50) {
    return {
      label: "cansado",
      xpPenaltyPct: 8,
      timePenaltyPct: 3,
      reason: "Aún puedes con la mochila, pero cada cuesta pesa más que la anterior.",
    };
  }
  if (value >= 25) {
    return {
      label: "fresco",
      xpPenaltyPct: 0,
      timePenaltyPct: 0,
      reason: "Buen tono. Los padrinos te miran sin desprecio.",
    };
  }
  return {
    label: "fresco",
    xpPenaltyPct: 0,
    timePenaltyPct: 0,
    reason: "Hierro fresco. La compañía en pleno aguanta tu ritmo.",
  };
}

const ROLE_WEIGHT_KEYS: Record<string, Partial<Record<StatId, number>>> = {
  piquero: { pike: 1.4, discipline: 1.2, vigor: 1.1 },
  arcabucero: { arquebus: 1.4, discipline: 1.1, cunning: 1.0 },
  espadachin: { sword: 1.4, vigor: 1.1, discipline: 1.0 },
  cabo: { command: 1.5, discipline: 1.3, vigor: 1.0 },
  sargento: { command: 1.5, discipline: 1.3, cunning: 1.0 },
  capitan: { command: 1.6, discipline: 1.2, cunning: 1.1 },
  alferez: { command: 1.2, discipline: 1.1, cunning: 1.0 },
};

function roleKeyFor(role: string): keyof typeof ROLE_WEIGHT_KEYS {
  const normalized = role.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (normalized.includes("cabo")) return "cabo";
  if (normalized.includes("sargento")) return "sargento";
  if (normalized.includes("capitan")) return "capitan";
  if (normalized.includes("alferez")) return "alferez";
  if (normalized.includes("piquero")) return "piquero";
  if (normalized.includes("espada")) return "espadachin";
  if (normalized.includes("arcabuz")) return "arcabucero";
  return "piquero";
}

export interface TrainingRecommendation {
  stat: StatId;
  reason: string;
  deficit: number;
}

export function recommendTraining(character: CharacterState, limit = 3): TrainingRecommendation[] {
  const stats = character.stats;
  const roleKey = roleKeyFor(character.role ?? "");
  const weights = ROLE_WEIGHT_KEYS[roleKey] ?? ROLE_WEIGHT_KEYS.piquero;
  const ids = Object.keys(STAT_SCALING) as StatId[];

  const entries: TrainingRecommendation[] = ids.map((stat) => {
    const current = stats[stat] ?? 0;
    const weight = weights[stat] ?? 1;
    const target = 10 * weight;
    const deficit = Math.max(0, target - current);
    return {
      stat,
      deficit,
      reason: reasonFor(stat, current, weight, deficit),
    };
  });

  return entries.sort((a, b) => b.deficit - a.deficit).slice(0, limit);
}

function reasonFor(stat: StatId, current: number, weight: number, deficit: number): string {
  const descriptor = STAT_SCALING[stat];
  if (deficit <= 0) return `Nivel ${current}: ya cubre lo esperado del rol.`;
  if (weight > 1.2) return `Base de toda formación sólida. Peso ${weight.toFixed(1)}x para tu rol.`;
  if (current === 0) return `Sin entrenar. Tu rol espera al menos nivel ${Math.ceil(10 * weight)}.`;
  return `Aporta ${descriptor.primary.toLowerCase()} que tu rol todavía no cubre.`;
}

export interface SummaryStat {
  stat: StatId;
  level: number;
  bonus: BonusBreakdown;
}

export function summarizeStats(stats: Stats): SummaryStat[] {
  return (Object.keys(STAT_SCALING) as StatId[]).map((stat) => ({
    stat,
    level: stats[stat] ?? 0,
    bonus: breakdownFor(stat, stats[stat] ?? 0),
  }));
}
