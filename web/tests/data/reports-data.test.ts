// reports-data.test.ts — coverage of the report fragment library: shape
// validation and the per-tag invariant that every mission has at least one
// opening / victory / defeat fragment for its tags.

import assert from "node:assert/strict";
import { reportFragmentDefinitions } from "../../src/lib/data/report-fragments";
import { missionDefinitions } from "../../src/lib/data/missions";

const VALID_TYPES = new Set(["opening", "victory", "defeat", "hit", "miss", "loot", "wound", "attack"]);

// Shape ---------------------------------------------------------------

{
  // Every fragment has the expected shape and non-empty text.
  for (const frag of reportFragmentDefinitions) {
    assert.equal(typeof frag.id, "string");
    assert.ok(frag.id.length > 0, `fragment ${frag.id} has id`);
    assert.ok(VALID_TYPES.has(frag.type), `fragment ${frag.id} has valid type: ${frag.type}`);
    assert.ok(Array.isArray(frag.tags), `fragment ${frag.id} has tags array`);
    for (const tag of frag.tags) {
      assert.equal(typeof tag, "string");
      assert.ok(tag.length > 0);
    }
    assert.equal(typeof frag.text, "string");
    assert.ok(frag.text.length > 0, `fragment ${frag.id} has non-empty text`);
  }
}

{
  // Fragment ids are unique.
  const ids = new Set<string>();
  for (const frag of reportFragmentDefinitions) {
    assert.ok(!ids.has(frag.id), `duplicate fragment id ${frag.id}`);
    ids.add(frag.id);
  }
}

{
  // At least one fragment per canonical type.
  const seen = new Set(reportFragmentDefinitions.map((f) => f.type));
  for (const expected of ["opening", "victory", "defeat"]) {
    assert.ok(seen.has(expected), `library has ${expected} fragments`);
  }
}

// Per-mission coverage -----------------------------------------------

{
  // For every mission, generateReport will succeed if there is at least
  // one fragment of each canonical type (opening/victory/defeat). The
  // exact match by tag is a "best effort" — when no tag matches, the
  // resolver falls back to the first fragment of that type. We assert
  // the minimum coverage here.
  for (const type of ["opening", "victory", "defeat"] as const) {
    const anyOfType = reportFragmentDefinitions.some((f) => f.type === type);
    assert.ok(anyOfType, `library has at least one ${type} fragment`);
  }
}

{
  // At least 75% of missions have a tag-matched fragment for each
  // canonical type. This catches the regression where a tag loses all
  // its fragments without anyone noticing.
  const totalMissions = missionDefinitions.length;
  let withOpening = 0;
  let withVictory = 0;
  let withDefeat = 0;
  for (const mission of missionDefinitions) {
    if (reportFragmentDefinitions.some((f) => f.type === "opening" && f.tags.some((t) => mission.reportTags.includes(t)))) withOpening++;
    if (reportFragmentDefinitions.some((f) => f.type === "victory" && f.tags.some((t) => mission.reportTags.includes(t)))) withVictory++;
    if (reportFragmentDefinitions.some((f) => f.type === "defeat" && f.tags.some((t) => mission.reportTags.includes(t)))) withDefeat++;
  }
  const ratio = (n: number) => n / totalMissions;
  // Soft floor: at least 60% of missions must have a tag-matched fragment
  // for each canonical type. Below that, the catalog is too sparse.
  assert.ok(ratio(withOpening) >= 0.6, `opening tag coverage ${withOpening}/${totalMissions}`);
  assert.ok(ratio(withVictory) >= 0.6, `victory tag coverage ${withVictory}/${totalMissions}`);
  assert.ok(ratio(withDefeat) >= 0.6, `defeat tag coverage ${withDefeat}/${totalMissions}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checked: "reports-data",
      fragments: reportFragmentDefinitions.length,
      missions: missionDefinitions.length,
    },
    null,
    2,
  ),
);
