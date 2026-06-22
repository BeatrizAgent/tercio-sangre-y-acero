import assert from "node:assert/strict";
import {
  buyItemInState,
  sellItemInState,
  buyChurchItemInState,
  buyChurchBlessingInState,
  donateItemInState,
} from "../../src/lib/domain/shop";
import { createTestState, withCoins } from "../helpers/state-fixtures";

const BASE_COINS = 1000;

// --- Armory buy/sell ---

{
  const state = withCoins(createTestState(), BASE_COINS);
  const itemId = "consumable_vendas_001";
  const before = state.soldier.inventory.find((i) => i.itemId === itemId)?.quantity ?? 0;

  const out = buyItemInState(state, itemId);
  assert.equal(out.result.ok, true, "buy vendas succeeds");
  assert.equal(out.next.soldier.coins, BASE_COINS - 10, "coins deducted");
  const after = out.next.soldier.inventory.find((i) => i.itemId === itemId)?.quantity ?? 0;
  assert.equal(after, before + 1, "vendas quantity increased");
}

{
  const state = withCoins(createTestState(), 5);
  const out = buyItemInState(state, "consumable_vendas_001");
  assert.equal(out.result.ok, false, "buy fails without coins");
  assert.equal(out.result.message, "Monedas insuficientes.");
  assert.equal(out.next.soldier.coins, 5, "coins unchanged");
}

{
  const state = withCoins(createTestState(), BASE_COINS);
  const out = buyItemInState(state, "item_inexistente");
  assert.equal(out.result.ok, false, "buy unknown item fails");
  assert.equal(out.result.message, "El objeto no está en venta.");
}

{
  // Inventory full: fill every slot with a 1x1 item so no space remains.
  const fullInventory: { itemId: string; quantity: number }[] = [];
  for (let i = 0; i < 120; i++) {
    fullInventory.push({ itemId: "consumable_pan_duro_001", quantity: 1 });
  }
  const state = withCoins(
    createTestState({ soldier: { inventory: [] as never } }),
    BASE_COINS,
  );
  state.soldier.inventory = fullInventory;
  const out = buyItemInState(state, "consumable_vendas_001");
  assert.equal(out.result.ok, false, "buy fails when inventory full");
  assert.equal(out.result.message, "No hay espacio en ningún baúl.");
}

{
  const state = withCoins(createTestState(), BASE_COINS);
  const itemId = "consumable_vendas_001";
  const owned = state.soldier.inventory.find((i) => i.itemId === itemId);
  assert.ok(owned, "starts with vendas");
  const out = sellItemInState(state, itemId);
  assert.equal(out.result.ok, true, "sell vendas succeeds");
  assert.equal(out.next.soldier.coins, BASE_COINS + 4, "sell price added");
  assert.equal(
    out.next.soldier.inventory.find((i) => i.itemId === itemId)?.quantity,
    owned.quantity - 1,
    "vendas quantity decreased",
  );
}

{
  const state = withCoins(createTestState(), BASE_COINS);
  const out = sellItemInState(state, "item_inexistente");
  assert.equal(out.result.ok, false, "sell unknown item fails");
  assert.equal(out.result.message, "No posees este objeto.");
}

// --- Church ---

{
  const state = withCoins(createTestState(), BASE_COINS);
  const out = buyChurchItemInState(state, "religious_rosario_001");
  assert.equal(out.result.ok, true, "buy church item succeeds");
  assert.equal(out.next.soldier.coins, BASE_COINS - 12, "church coins deducted");
}

{
  const state = withCoins(createTestState(), 5);
  const out = buyChurchItemInState(state, "religious_rosario_001");
  assert.equal(out.result.ok, false, "church buy fails without coins");
  assert.equal(out.result.message, "Doblones insuficientes para el relicario.");
}

{
  const state = withCoins(createTestState(), BASE_COINS);
  const out = buyChurchBlessingInState(state, "misa_de_marcha");
  assert.equal(out.result.ok, true, "blessing succeeds");
  assert.equal(out.next.soldier.coins, BASE_COINS - 8, "blessing cost deducted");
  assert.equal(out.next.soldier.honor, 1, "honor increased by blessing");
}

{
  const state = withCoins(createTestState(), BASE_COINS);
  const out = buyChurchBlessingInState(state, "bendicion_del_estandarte");
  assert.equal(out.result.ok, true, "banner blessing succeeds");
  assert.equal(out.next.soldier.coins, BASE_COINS - 20);
  assert.equal(out.next.soldier.honor, 2);
  assert.equal(out.next.soldier.reputation, 1);
}

{
  const state = withCoins(createTestState(), 5);
  const out = buyChurchBlessingInState(state, "misa_de_marcha");
  assert.equal(out.result.ok, false, "blessing fails without coins");
  assert.equal(out.result.message, "Doblones insuficientes para la ofrenda.");
}

// --- Donate ---

{
  const state = withCoins(createTestState(), BASE_COINS);
  const itemId = "consumable_pan_duro_001";
  const owned = state.soldier.inventory.find((i) => i.itemId === itemId);
  assert.ok(owned, "starts with pan duro");
  const out = donateItemInState(state, itemId);
  assert.equal(out.result.ok, true, "donate succeeds");
  assert.equal(
    out.next.soldier.inventory.find((i) => i.itemId === itemId)?.quantity,
    owned.quantity - 1,
    "donated quantity decreased",
  );
}

{
  const state = withCoins(createTestState(), BASE_COINS);
  const out = donateItemInState(state, "item_inexistente");
  assert.equal(out.result.ok, false, "donate unknown item fails");
  assert.equal(out.result.message, "No posees este objeto.");
}

{
  // Donating an equipped item clears the slot.
  const state = withCoins(createTestState(), BASE_COINS);
  const itemId = "chest_cuirass_001";
  assert.equal(state.soldier.equipment.body, itemId, "cuirass is equipped");
  const out = donateItemInState(state, itemId);
  assert.equal(out.result.ok, true, "donate equipped item succeeds");
  assert.equal(out.next.soldier.equipment.body, null, "body slot cleared");
}

console.log(JSON.stringify({ ok: true, checked: "shop" }, null, 2));
