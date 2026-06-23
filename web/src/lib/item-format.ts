import type { Passive, Rarity } from "./types";

const RARITY_STYLES: Record<Rarity, { label: string; color: string; ring: string; bg: string; bar: string }> = {
  common: {
    label: "Común",
    color: "text-stone-300",
    ring: "border-stone-500/60",
    bg: "bg-stone-700/20",
    bar: "bg-stone-400",
  },
  uncommon: {
    label: "Poco Común",
    color: "text-emerald-300",
    ring: "border-emerald-500/60",
    bg: "bg-emerald-700/15",
    bar: "bg-emerald-400",
  },
  rare: {
    label: "Rara",
    color: "text-teal-300",
    ring: "border-teal-500/60",
    bg: "bg-teal-700/15",
    bar: "bg-teal-400",
  },
  epic: {
    label: "Epica",
    color: "text-blood-bright",
    ring: "border-blood/60",
    bg: "bg-blood/15",
    bar: "bg-blood",
  },
  legendary: {
    label: "Legendaria",
    color: "text-amber-300",
    ring: "border-amber-400/70",
    bg: "bg-amber-700/20",
    bar: "bg-amber-300",
  },
};

export function rarityStyle(r: Rarity | undefined) {
  return RARITY_STYLES[r ?? "common"];
}

export function rarityLabel(r: Rarity | undefined): string {
  return r ? RARITY_STYLES[r].label : "Común";
}

export const TRIGGER_LABEL: Record<Passive["trigger"], string> = {
  passive: "Pasiva",
  on_hit: "En el golpe",
  on_kill: "Al matar",
  on_wound: "Al recibir herida",
  on_mission_start: "Al iniciar misión",
  on_mission_end: "Al final de misión",
  on_loot: "En el botín",
};

export function passiveShortLine(p: Passive): string {
  switch (p.id) {
    case "linea_de_picas":
      return `+${p.effect.pike ?? 0} pica con disciplina ≥4`;
    case "bendicion_del_capellan":
      return `+${p.effect.honor ?? 0} honor al cerrar misión`;
    case "hierro_de_flandes":
      return `${Math.round((p.effect.chance ?? 0) * 100)}% ignora herida grave`;
    case "botin_de_muro":
      return `+${Math.round((p.effect.coins_pct ?? 0) * 100)}% monedas en botín`;
    case "furia_del_tercio":
      return `+${p.effect.pike ?? 0}/${p.effect.sword ?? 0} con vigor ≥3`;
    case "sangre_y_barro":
      return `+${p.effect.vigor ?? 0} vigor al matar (${p.effect.duration ?? 0} turnos)`;
    case "relicario_de_sangre":
      return `+${p.effect.honor ?? 0} honor pasivo, +1 carga/misión`;
    case "gafe":
      return `${p.effect.discipline ?? 0} disciplina permanente`;
    case "mirada_del_capitan":
      return `+${p.effect.command ?? 0} mando, los reclutas te miran`;
    case "tiro_certero":
      return `+${p.effect.arquebus ?? 0} arcabuz, mejor en niebla`;
    case "escudo_de_hierro":
      return `+${p.effect.vigor ?? 0} vigor, -5% wound chance`;
    case "pies_ligeros":
      return `+${p.effect.vigor ?? 0} vigor, -10% fatiga de marcha`;
    case "ojo_de_halcon":
      return `+${p.effect.cunning ?? 0} astucia, detecta emboscadas`;
    case "silencio_de_verdugo":
      return `+${p.effect.sword ?? 0} espada en el primer golpe`;
    default:
      return p.description;
  }
}
