// formation.test.ts — exhaustive coverage of the formation domain helpers:
// pickTopStat, getFitState, isNCOInStress, getFormationPreset, and every
// preset in TERCIO_FORMATION_PRESETS.

import assert from "node:assert/strict";
import {
  COMBAT_STAT_LABEL,
  DEFAULT_TERCIO_FORMATION_ID,
  FORMATION_META,
  FORMATION_ORDER,
  TERCIO_FORMATION_PRESETS,
  getFitState,
  getFormationPreset,
  isNCOInStress,
  pickTopStat,
  type TercioFormationPresetId,
} from "../../src/lib/domain/formation";
import { makeCharacterState } from "../helpers/formation-fixtures";
import type { CharacterState, FormationSlot, StatId, Stats } from "../../src/lib/types";

// pickTopStat -----------------------------------------------------------

{
  // Highest of the key stats wins; ties keep the first listed (pike).
  assert.equal(pickTopStat({ pike: 5, sword: 3, arquebus: 1, discipline: 2, vigor: 1, cunning: 1, command: 0 }), "pike");
  assert.equal(pickTopStat({ pike: 1, sword: 8, arquebus: 1, discipline: 2, vigor: 1, cunning: 1, command: 0 }), "sword");
  assert.equal(pickTopStat({ pike: 1, sword: 1, arquebus: 9, discipline: 1, vigor: 1, cunning: 1, command: 0 }), "arquebus");
  assert.equal(pickTopStat({ pike: 0, sword: 0, arquebus: 0, discipline: 7, vigor: 0, cunning: 0, command: 0 }), "discipline");
  assert.equal(pickTopStat({ pike: 1, sword: 1, arquebus: 1, discipline: 1, vigor: 1, cunning: 1, command: 5 }), "command");
  // All zero: the first KEY_STATS entry (pike) is the tie-breaker (0 > -1).
  assert.equal(pickTopStat({ pike: 0, sword: 0, arquebus: 0, discipline: 0, vigor: 0, cunning: 0, command: 0 }), "pike");
}

{
  // COMBAT_STAT_LABEL covers every StatId.
  const expected: Record<StatId, string> = {
    pike: "Pica",
    sword: "Espada",
    arquebus: "Arcabuz",
    discipline: "Disciplina",
    vigor: "Vigor",
    cunning: "Astucia",
    command: "Mando",
  };
  for (const stat of Object.keys(expected) as StatId[]) {
    assert.equal(COMBAT_STAT_LABEL[stat], expected[stat], `label for ${stat}`);
  }
}

{
  // FORMATION_ORDER lists every slot exactly once and in the visual order.
  assert.deepEqual(FORMATION_ORDER, ["vanguardia", "fuego", "apoyo", "retaguardia", "banquillo"]);
  for (const slot of FORMATION_ORDER) {
    assert.ok(FORMATION_META[slot], `meta exists for ${slot}`);
    assert.ok(FORMATION_META[slot].Icon, `meta has icon for ${slot}`);
    assert.ok(typeof FORMATION_META[slot].label === "string" && FORMATION_META[slot].label.length > 0, `meta has label for ${slot}`);
  }
}

// getFitState -----------------------------------------------------------

{
  // banquillo slot: always banquillo regardless of stats.
  const a = makeCharacterState({ formationSlot: "banquillo", stats: { pike: 100 } });
  assert.equal(getFitState(a, "banquillo"), "banquillo");
  assert.equal(getFitState(a, "vanguardia"), "encaja");
  assert.equal(getFitState(a, "fuego"), "fuera_de_rol");
}

{
  // Top-2 stat matching preferred stat -> encaja.
  const b = makeCharacterState({ formationSlot: "vanguardia", stats: { pike: 10, sword: 2, arquebus: 1, discipline: 1 } });
  assert.equal(getFitState(b, "vanguardia"), "encaja");
}

{
  // Preferred stat is NOT in top-2 -> fuera_de_rol.
  const c = makeCharacterState({ formationSlot: "vanguardia", stats: { pike: 1, sword: 10, arquebus: 1, discipline: 10 } });
  assert.equal(getFitState(c, "vanguardia"), "fuera_de_rol");
}

{
  // fuego prefers arquebus; with high arquebus + high discipline the top 2
  // include arquebus so it fits.
  const d = makeCharacterState({ formationSlot: "fuego", stats: { arquebus: 10, discipline: 5 } });
  assert.equal(getFitState(d, "fuego"), "encaja");
}

{
  // apoyo prefers discipline; with high discipline it fits.
  const e = makeCharacterState({ formationSlot: "apoyo", stats: { discipline: 10, pike: 1, sword: 1, arquebus: 1 } });
  assert.equal(getFitState(e, "apoyo"), "encaja");
}

{
  // retaguardia prefers command; with high command it fits.
  const f = makeCharacterState({ formationSlot: "retaguardia", stats: { command: 5, discipline: 1 } });
  assert.equal(getFitState(f, "retaguardia"), "encaja");
}

// isNCOInStress ---------------------------------------------------------

{
  // banquillo -> stress.
  const a = makeCharacterState({ formationSlot: "banquillo", fatigue: 10 });
  assert.equal(isNCOInStress(a), true, "banquillo is stress");
}

{
  // High fatigue (>75) -> stress.
  const b = makeCharacterState({ formationSlot: "vanguardia", fatigue: 80, stats: { pike: 10 } });
  assert.equal(isNCOInStress(b), true, "fatigue 80 is stress");
}

{
  // Wrong row + low fatigue -> stress. Build a character where pike is
  // NOT in the top 2 stats.
  const c = makeCharacterState({
    formationSlot: "vanguardia",
    fatigue: 10,
    stats: { pike: 1, sword: 10, arquebus: 10, discipline: 10, vigor: 1, cunning: 1, command: 0 },
  });
  // Top 2 are sword(10) and arquebus(10) (or arquebus(10) + discipline(10)
  // depending on order). Either way, pike is excluded.
  assert.equal(isNCOInStress(c), true, "wrong row is stress");
}

{
  // Vanguardia, low fatigue, pike in top 2 -> calm.
  const d = makeCharacterState({ formationSlot: "vanguardia", fatigue: 10, stats: { pike: 10, sword: 1, arquebus: 1 } });
  assert.equal(isNCOInStress(d), false, "vanguardia pike-fit is calm");
}

// getFormationPreset ----------------------------------------------------

{
  // Known id -> exact match.
  const cuadro = getFormationPreset("cuadro_de_picas");
  assert.equal(cuadro.id, "cuadro_de_picas");
  assert.equal(cuadro.doctrine, "pica");
  assert.ok(typeof cuadro.name === "string" && cuadro.name.length > 0);
  assert.ok(typeof cuadro.description === "string" && cuadro.description.length > 0);
}

{
  // Unknown id -> falls back to first preset.
  const fallback = getFormationPreset("not-a-real-preset" as TercioFormationPresetId);
  assert.equal(fallback.id, TERCIO_FORMATION_PRESETS[0].id, "falls back to first preset");
}

{
  // DEFAULT_TERCIO_FORMATION_ID is a real preset.
  const def = getFormationPreset(DEFAULT_TERCIO_FORMATION_ID);
  assert.equal(def.id, DEFAULT_TERCIO_FORMATION_ID, "default preset is in the list");
}

// Preset validation -----------------------------------------------------

{
  // Every preset:
  //  - has a unique id
  //  - assigns every FORMATION_CHARACTER_ID
  //  - assigns only slots from FORMATION_ORDER
  //  - assigns the player (diego_de_arce) to a non-banquillo slot
  //  - has at most one character on banquillo
  const ids = new Set<string>();
  for (const preset of TERCIO_FORMATION_PRESETS) {
    assert.ok(!ids.has(preset.id), `duplicate preset id: ${preset.id}`);
    ids.add(preset.id);

    assert.ok(preset.name.length > 0, `${preset.id} has a name`);
    assert.ok(preset.description.length > 0, `${preset.id} has a description`);

    const expectedChars = ["diego_de_arce", "lope_de_saavedra", "martin_de_cuenca", "alonso_de_valdes", "sancho_de_leiva"];
    for (const charId of expectedChars) {
      assert.ok(preset.assignments[charId as keyof typeof preset.assignments], `${preset.id} assigns ${charId}`);
    }

    const assignedSlots = Object.values(preset.assignments);
    for (const slot of assignedSlots) {
      assert.ok(FORMATION_ORDER.includes(slot), `${preset.id} assigns valid slot ${slot}`);
    }

    const banquilloCount = assignedSlots.filter((s) => s === "banquillo").length;
    assert.ok(banquilloCount <= 1, `${preset.id} has at most one banquillo (got ${banquilloCount})`);

    const playerSlot = preset.assignments.diego_de_arce;
    assert.notEqual(playerSlot, "banquillo", `${preset.id} keeps the player off banquillo`);
  }

  // At least 10 presets (cuadro, fuego, defensivo, socorro, escolta,
  // emboscada, columna, bagajes, brecha, reserva) per the design.
  assert.ok(TERCIO_FORMATION_PRESETS.length >= 10, `expected at least 10 presets, got ${TERCIO_FORMATION_PRESETS.length}`);
}

// FORMATION_META --------------------------------------------------------

{
  // banquillo has null preferredStat and a unique icon.
  assert.equal(FORMATION_META.banquillo.preferredStat, null);
  assert.ok(FORMATION_META.banquillo.Icon, "banquillo has an icon");
  // Every other slot has a non-null preferredStat.
  for (const slot of ["vanguardia", "fuego", "apoyo", "retaguardia"] as const) {
    assert.ok(FORMATION_META[slot].preferredStat, `${slot} has a preferredStat`);
    assert.ok(FORMATION_META[slot].Icon, `${slot} has an icon`);
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checked: "formation",
      presets: TERCIO_FORMATION_PRESETS.length,
    },
    null,
    2,
  ),
);
