import assert from "node:assert/strict";
import {
  equipItemInState,
  unequipItemInState,
  unequipIntoBackpack,
  getEquipmentBonuses,
} from "../../src/lib/domain/equipment";
import { createTestState } from "../helpers/state-fixtures";

{
  const state = createTestState();
  const out = equipItemInState(state, "chest_cuirass_001");
  assert.equal(out.result.ok, true, "equip owned item succeeds");
  assert.equal(out.next.soldier.equipment.body, "chest_cuirass_001", "body slot equipped");
}

{
  const state = createTestState();
  const out = equipItemInState(state, "item_inexistente");
  assert.equal(out.result.ok, false, "equip unknown item fails");
  assert.equal(out.result.message, "Objeto desconocido.");
}

{
  const state = createTestState();
  const out = equipItemInState(state, "weapon_pica_ash_001");
  assert.equal(out.result.ok, false, "equip unowned item fails");
  assert.equal(out.result.message, "No tienes ese objeto en tu inventario.");
}

{
  const state = createTestState();
  const out = unequipItemInState(state, "body");
  assert.equal(out.result.ok, true, "unequip body succeeds");
  assert.equal(out.next.soldier.equipment.body, null, "body slot cleared");
}

{
  const state = createTestState();
  const out = unequipItemInState(state, "head");
  assert.equal(out.result.ok, false, "unequip empty slot fails");
  assert.equal(out.result.message, "No hay nada equipado en esta ranura.");
}

{
  // Unequip into backpack adds the item back to inventory.
  const state = createTestState();
  const itemId = state.soldier.equipment.body as string;
  assert.ok(itemId, "body item exists");
  const before = state.soldier.inventory.find((i) => i.itemId === itemId)?.quantity ?? 0;
  const out = unequipIntoBackpack(state, "body");
  assert.equal(out.result.ok, true, "unequip into backpack succeeds");
  assert.equal(out.next.soldier.equipment.body, null, "body slot cleared");
  const after = out.next.soldier.inventory.find((i) => i.itemId === itemId)?.quantity ?? 0;
  assert.equal(after, before + 1, "item returned to inventory");
}

{
  // Equipment bonuses accumulate from all equipped items.
  const state = createTestState();
  const bonuses = getEquipmentBonuses(state.soldier.equipment);
  assert.ok(typeof bonuses.pike === "number" || bonuses.pike === undefined, "bonuses map returned");
  assert.ok(Object.keys(bonuses).length > 0, "starting equipment gives bonuses");
}

{
  const bonuses = getEquipmentBonuses({
    head: null,
    body: null,
    mainHand: null,
    offHand: null,
    firearm: null,
    accessory: null,
    boots: null,
    consumable: null,
  });
  assert.deepEqual(bonuses, {}, "empty equipment gives no bonuses");
}

console.log(JSON.stringify({ ok: true, checked: "equipment" }, null, 2));
