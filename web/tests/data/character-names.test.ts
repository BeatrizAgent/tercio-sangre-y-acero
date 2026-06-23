import assert from "node:assert/strict";
import { characterNames } from "../../src/lib/data/character-names";
import {
  findDuplicateNames,
  generateCharacterName,
  normalizeCharacterName,
  validateCharacterNamePools,
} from "../../src/lib/domain/names";

assert.equal(normalizeCharacterName("  Álvaro  "), "alvaro");
assert.deepEqual(findDuplicateNames(["Álvaro", "alvaro", "Diego"]), ["alvaro"]);

assert.doesNotThrow(() => validateCharacterNamePools(characterNames));
assert.ok(characterNames.firstNames.length > 0, "firstNames must not be empty");
assert.ok(characterNames.surnames.length > 0, "surnames must not be empty");

const generated = generateCharacterName();
assert.ok(characterNames.firstNames.includes(generated.firstName));
assert.ok(characterNames.surnames.includes(generated.surname));
assert.equal(generated.fullName, `${generated.firstName} de ${generated.surname}`);

console.log(JSON.stringify({ ok: true, checked: "character-names" }, null, 2));
