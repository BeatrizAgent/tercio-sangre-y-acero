// events.test.ts — coverage of resolveActiveEventChoice via the game store
// (the real domain path) for every effect kind and the failure modes.
//
// The store's resolveActiveEventChoice applies the choice effect AND
// then runs applyMissionRewardsInState(pendingMissionId). Tests assert
// the choice delta on top of whatever the mission would add.

import assert from "node:assert/strict";
import { useGameStore } from "../../src/lib/stores/game-store";
import { createTestState } from "../helpers/state-fixtures";
import { makeGameEvent } from "../helpers/event-fixtures";
import { eventDefinitions } from "../../src/lib/data/events";

function freshState() {
  // We bypass createInitialState to set exactly the fields we want.
  const base = createTestState();
  return {
    ...base,
    soldier: { ...base.soldier, coins: 50, honor: 0, reputation: 0, corruption: 0, fatigue: 0 },
    pendingMissionId: "mission_guardia_noche_001",
  };
}

function reset() {
  useGameStore.getState().resetState();
  useGameStore.getState().hydrateState({ ...freshState(), activeEvent: makeGameEvent() });
}

function delta() {
  const before = { coins: 50, honor: 0, reputation: 0, corruption: 0, fatigue: 0 };
  const after = useGameStore.getState().soldier;
  return {
    coins: after.coins - before.coins,
    honor: after.honor - before.honor,
    reputation: after.reputation - before.reputation,
    corruption: after.corruption - before.corruption,
    fatigue: after.fatigue - before.fatigue,
  };
}

// shape: eventDefinitions non-empty ------------------------------------

{
  // eventDefinitions is non-empty and every entry has the expected shape.
  assert.ok(Array.isArray(eventDefinitions));
  assert.ok(eventDefinitions.length > 0, "events defined");
  for (const evt of eventDefinitions) {
    assert.equal(typeof evt.id, "string");
    assert.equal(typeof evt.title, "string");
    assert.equal(typeof evt.text, "string");
    assert.ok(Array.isArray(evt.choices) && evt.choices.length > 0, `event ${evt.id} has choices`);
    for (const choice of evt.choices) {
      assert.equal(typeof choice.id, "string");
      assert.equal(typeof choice.label, "string");
      assert.equal(typeof choice.effects, "object");
      assert.equal(typeof choice.result_text, "string");
    }
  }
}

// resolveActiveEventChoice via the real store --------------------------

{
  // No active event -> no-op, returns ok=false with the "no event" message.
  useGameStore.getState().resetState();
  const out = useGameStore.getState().resolveActiveEventChoice("choice_help");
  assert.equal(out.ok, false);
  assert.match(out.message, /no hay ning.n evento/i);
}

{
  // choice_help adds honor +1, subtracts 5 coins. The pending mission
  // also adds its own rewards (+1 coin). We assert the choice delta
  // explicitly.
  reset();
  const out = useGameStore.getState().resolveActiveEventChoice("choice_help");
  assert.equal(out.ok, true);
  const d = delta();
  assert.equal(d.honor, 1, "choice_help adds 1 honor");
  // -5 (choice) + 1 (mission reward) = -4.
  assert.equal(d.coins, -4, "choice_help subtracts 5 coins + 1 mission");
}

{
  // choice_ignore subtracts 1 reputation.
  reset();
  const out = useGameStore.getState().resolveActiveEventChoice("choice_ignore");
  assert.equal(out.ok, true);
  const d = delta();
  assert.equal(d.reputation, -1, "choice_ignore subtracts 1 reputation");
}

{
  // Unknown choice id -> no-op.
  reset();
  const out = useGameStore.getState().resolveActiveEventChoice("choice_does_not_exist");
  assert.equal(out.ok, false);
}

{
  // Fatigue effect (clamped 0..100). Choice subtracts 50, mission adds 4.
  useGameStore.getState().resetState();
  useGameStore.getState().hydrateState({
    ...freshState(),
    activeEvent: makeGameEvent({
      choices: [
        { id: "rest", label: "Descansar", requirements: {}, effects: { fatigue: -50 }, result_text: "Duermes." },
        { id: "marry", label: "Cargar", requirements: {}, effects: { fatigue: 200 }, result_text: "Te machacas." },
      ],
    }),
  });
  useGameStore.getState().resolveActiveEventChoice("rest");
  // Choice: 0 - 50 = 0 (clamped). Mission: 0 + 4 = 4.
  assert.equal(useGameStore.getState().soldier.fatigue, 4, "choice clamped to 0 then mission +4");
}

{
  // Corruption effect: clamped 0..100.
  useGameStore.getState().resetState();
  useGameStore.getState().hydrateState({
    ...freshState(),
    activeEvent: makeGameEvent({
      choices: [
        { id: "good", label: "Honrar", requirements: {}, effects: { corruption: -10 }, result_text: "Bien." },
      ],
    }),
  });
  useGameStore.getState().resolveActiveEventChoice("good");
  assert.equal(useGameStore.getState().soldier.corruption, 0, "corruption floored");
}

{
  // Wound effect: adds an untreated wound to the soldier.
  useGameStore.getState().resetState();
  useGameStore.getState().hydrateState({
    ...freshState(),
    activeEvent: makeGameEvent({
      choices: [
        { id: "bleed", label: "Sangrar", requirements: {}, effects: { wound: "wound_corte_mano_001" }, result_text: "Te cortas." },
      ],
    }),
  });
  useGameStore.getState().resolveActiveEventChoice("bleed");
  const after = useGameStore.getState().soldier;
  // Mission may also add a wound; just assert the event choice added one.
  assert.ok(after.wounds.some((w) => w.woundId === "wound_corte_mano_001" && !w.treated));
}

{
  // Items effect: drops items into the inventory.
  useGameStore.getState().resetState();
  useGameStore.getState().hydrateState({
    ...freshState(),
    activeEvent: makeGameEvent({
      choices: [
        {
          id: "loot",
          label: "Cogerlo",
          requirements: {},
          effects: { items: [{ itemId: "consumable_pan_duro_001", quantity: 1 }] },
          result_text: "Lo guardas.",
        },
      ],
    }),
  });
  useGameStore.getState().resolveActiveEventChoice("loot");
  const after = useGameStore.getState().soldier;
  const stack = after.inventory.find((item) => item.itemId === "consumable_pan_duro_001");
  assert.ok(stack);
  assert.ok(stack!.quantity >= 1);
}

{
  // breakEquipment: removes an equipped item from a random slot.
  useGameStore.getState().resetState();
  useGameStore.getState().hydrateState({
    ...freshState(),
    activeEvent: makeGameEvent({
      choices: [
        { id: "sacrifice", label: "Romperlo", requirements: {}, effects: { breakEquipment: true }, result_text: "Se rompe." },
      ],
    }),
  });
  const beforeEquipment = { ...useGameStore.getState().soldier.equipment };
  const beforeEquipped = Object.values(beforeEquipment).filter((v) => v !== null) as string[];
  assert.ok(beforeEquipped.length > 0, "starts with at least one slot equipped");
  useGameStore.getState().resolveActiveEventChoice("sacrifice");
  const after = useGameStore.getState().soldier;
  // Exactly one slot is now null (the one that was broken).
  const afterEquipped = Object.entries(beforeEquipment).filter(
    ([, itemId]) => itemId !== null && after.equipment[([0] as [string])[0] as keyof typeof after.equipment] === null,
  );
  // The broken item is no longer in inventory.
  const brokenItemIds = Object.values(beforeEquipment).filter(
    (v) => v !== null && after.equipment[Object.keys(beforeEquipment).find((k) => beforeEquipment[k as keyof typeof beforeEquipment] === v) as keyof typeof after.equipment] === null,
  ) as string[];
  for (const id of brokenItemIds) {
    const stillInInventory = after.inventory.some((item) => item.itemId === id);
    assert.equal(stillInInventory, false, `broken ${id} removed from inventory`);
  }
  // Exactly one slot changed.
  let nulledSlots = 0;
  for (const slot of Object.keys(beforeEquipment) as Array<keyof typeof beforeEquipment>) {
    if (beforeEquipment[slot] !== null && after.equipment[slot] === null) nulledSlots += 1;
  }
  assert.equal(nulledSlots, 1, "exactly one slot was broken");
  // The other equipped slots are unchanged.
  let keptSlots = 0;
  for (const slot of Object.keys(beforeEquipment) as Array<keyof typeof beforeEquipment>) {
    if (beforeEquipment[slot] !== null && after.equipment[slot] === beforeEquipment[slot]) keptSlots += 1;
  }
  assert.equal(keptSlots, beforeEquipped.length - 1, "other slots kept their items");
}

{
  // Combined effects in a single choice.
  useGameStore.getState().resetState();
  useGameStore.getState().hydrateState({
    ...freshState(),
    activeEvent: makeGameEvent({
      choices: [
        {
          id: "all_in",
          label: "Todo a una",
          requirements: {},
          effects: {
            coins: -10,
            honor: 2,
            reputation: 1,
            corruption: 5,
            fatigue: 20,
          },
          result_text: "Apuestas todo.",
        },
      ],
    }),
  });
  useGameStore.getState().resolveActiveEventChoice("all_in");
  const d = delta();
  // coins: choice -10 + mission +1 = -9.
  assert.equal(d.coins, -9, "all_in coins");
  assert.equal(d.honor, 2, "all_in honor");
  assert.equal(d.reputation, 1, "all_in reputation");
  assert.equal(d.corruption, 5, "all_in corruption");
  // fatigue: choice +20; mission +4 = 24.
  assert.equal(d.fatigue, 24, "all_in fatigue");
}

console.log(JSON.stringify({ ok: true, checked: "events" }, null, 2));
