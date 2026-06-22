import assert from "node:assert/strict";
import { applyWoundInState, treatWoundInState } from "../../src/lib/domain/wounds";
import { createTestState } from "../helpers/state-fixtures";

{
  const state = createTestState();
  const out = applyWoundInState(state, "cut_gash");
  assert.equal(out.result.ok, true, "apply wound succeeds");
  assert.equal(out.next.soldier.wounds.length, 1, "wound added");
  assert.equal(out.next.soldier.wounds[0].woundId, "cut_gash", "correct wound id");
  assert.equal(out.next.soldier.wounds[0].treated, false, "wound untreated");
}

{
  const state = createTestState();
  const out = treatWoundInState(state, "no_existe");
  assert.equal(out.result.ok, false, "treat unknown wound fails");
  assert.equal(out.result.message, "Herida no encontrada.");
}

{
  // Treat wound consumes one bandage and marks wound treated.
  const state = createTestState();
  assert.ok(
    state.soldier.inventory.some((i) => i.itemId === "consumable_vendas_001" && i.quantity > 0),
    "starts with bandages",
  );
  const wounded = applyWoundInState(state, "cut_gash").next;
  const woundId = wounded.soldier.wounds[0].id;
  const before = wounded.soldier.inventory.find((i) => i.itemId === "consumable_vendas_001")!.quantity;

  const out = treatWoundInState(wounded, woundId);
  assert.equal(out.result.ok, true, "treat wound succeeds");
  assert.equal(out.next.soldier.wounds[0].treated, true, "wound marked treated");
  const after = out.next.soldier.inventory.find((i) => i.itemId === "consumable_vendas_001")?.quantity ?? 0;
  assert.equal(after, before - 1, "one bandage consumed");
}

{
  // Treat fails without bandages.
  const state = createTestState({ soldier: { inventory: [] as never } });
  const wounded = applyWoundInState(state, "cut_gash").next;
  const woundId = wounded.soldier.wounds[0].id;
  const out = treatWoundInState(wounded, woundId);
  assert.equal(out.result.ok, false, "treat fails without bandages");
  assert.equal(out.result.message, "No tienes vendas limpias disponibles.");
}

console.log(JSON.stringify({ ok: true, checked: "wounds" }, null, 2));
