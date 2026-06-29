// character-level.test.ts — exhaustive coverage of getCharacterLevel.

import assert from "node:assert/strict";
import { getCharacterLevel } from "../../src/lib/domain/character-level";
import type { Stats } from "../../src/lib/types";

{
  // All zeros: sum is 0.
  const stats: Stats = { pike: 0, sword: 0, arquebus: 0, discipline: 0, vigor: 0, cunning: 0, command: 0 };
  assert.equal(getCharacterLevel(stats), 0);
}

{
  // All ones: sum is 7.
  const stats: Stats = { pike: 1, sword: 1, arquebus: 1, discipline: 1, vigor: 1, cunning: 1, command: 1 };
  assert.equal(getCharacterLevel(stats), 7);
}

{
  // Diego de Arce default: 2+1+1+2+2+1+0 = 9.
  const stats: Stats = { pike: 2, sword: 1, arquebus: 1, discipline: 2, vigor: 2, cunning: 1, command: 0 };
  assert.equal(getCharacterLevel(stats), 9);
}

{
  // Undefined values are coerced to 0 by Number(undefined).
  const stats = { pike: 5, sword: 0, arquebus: 0, discipline: 0, vigor: 0, cunning: 0, command: 0 } as unknown as Stats;
  assert.equal(getCharacterLevel(stats), 5);
}

{
  // Negative values are summed literally (no clamp in this helper).
  const stats: Stats = { pike: -2, sword: 10, arquebus: 0, discipline: 0, vigor: 0, cunning: 0, command: 0 };
  assert.equal(getCharacterLevel(stats), 8);
}

{
  // Large values do not overflow Number in JS; sanity check.
  const stats: Stats = { pike: 100, sword: 100, arquebus: 100, discipline: 100, vigor: 100, cunning: 100, command: 100 };
  assert.equal(getCharacterLevel(stats), 700);
}

console.log(JSON.stringify({ ok: true, checked: "character-level" }, null, 2));
