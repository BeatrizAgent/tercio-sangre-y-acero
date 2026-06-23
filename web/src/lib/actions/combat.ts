"use server";

import { revalidatePath } from "next/cache";
import { getItem, getMission } from "../data";
import { eventDefinitions } from "../data/events";
import { fightArenaOpponentInStateWithOpponent } from "../domain/arena";
import { addInventoryItem, BACKPACK_CHESTS, BACKPACK_COLS, BACKPACK_ROWS, inventoryWithAutoLayout } from "../domain/inventory-grid";
import { applyMissionRewardsInState } from "../domain/missions";
import { fail, ok, type ActionResult } from "../domain/result";
import { getArenaOpponentFromDb } from "../server/arena-bots";
import { consumeActionGate } from "../server/action-gate-store";
import { loadGameState, persistGameState } from "./_demo";
import type { GameState, InventoryItem, Soldier } from "../types";

export interface StartMissionArgs {
  missionId: string;
  gateToken?: string;
}

export interface FightArenaOpponentArgs {
  opponentId: string;
  gateToken?: string;
}

export interface ResolveActiveEventChoiceArgs {
  choiceId: string;
  gateToken?: string;
}

export async function startMissionAction({
  missionId,
  gateToken,
}: StartMissionArgs): Promise<ActionResult<{ state: GameState; reportId?: string; eventTriggered?: boolean }>> {
  const gate = consumeActionGate({
    token: gateToken,
    kind: "mission",
    targetId: missionId,
  });
  if (!gate.ok) return fail(gate.message);

  const state = await loadGameState();
  const mission = getMission(missionId);
  if (!mission) return fail("Misión desconocida.");

  const updatedSoldier = { ...state.soldier };
  if (updatedSoldier.banMissionsLeft > 0) {
    updatedSoldier.banMissionsLeft = Math.max(0, updatedSoldier.banMissionsLeft - 1);
  }

  const shouldTriggerEvent = Math.random() < 0.40 && eventDefinitions.length > 0;
  if (shouldTriggerEvent) {
    const randomEvent = eventDefinitions[Math.floor(Math.random() * eventDefinitions.length)];
    const next = {
      ...state,
      soldier: updatedSoldier,
      activeEvent: randomEvent,
      pendingMissionId: missionId,
    };
    await persistGameState(next);
    revalidateMissionPaths(missionId);
    return ok("Evento de misión activado.", { state: next, eventTriggered: true });
  }

  const out = applyMissionRewardsInState({ ...state, soldier: updatedSoldier }, missionId);
  if (!out.result.ok) return out.result as ActionResult<{ state: GameState; reportId?: string }>;
  await persistGameState(out.next);
  revalidateMissionPaths(missionId);
  return ok(out.result.message, { state: out.next, reportId: out.result.data?.reportId });
}

export async function fightArenaOpponentAction({
  opponentId,
  gateToken,
}: FightArenaOpponentArgs): Promise<ActionResult<{ state: GameState; resultId?: string }>> {
  const gate = consumeActionGate({
    token: gateToken,
    kind: "arena",
    targetId: opponentId,
  });
  if (!gate.ok) return fail(gate.message);

  const state = await loadGameState();
  const opponent = await getArenaOpponentFromDb(opponentId);
  if (!opponent) return fail("Rival de arena desconocido.");

  const out = fightArenaOpponentInStateWithOpponent(state, opponent);
  if (!out.result.ok) return out.result as ActionResult<{ state: GameState; resultId?: string }>;
  await persistGameState(out.next);
  revalidatePath("/arena");
  revalidatePath("/soldier");
  return ok(out.result.message, { state: out.next, resultId: out.result.data?.resultId });
}

export async function resolveActiveEventChoiceAction({
  choiceId,
  gateToken,
}: ResolveActiveEventChoiceArgs): Promise<ActionResult<{ state: GameState; reportId?: string }>> {
  const state = await loadGameState();
  if (!state.activeEvent || !state.pendingMissionId) return fail("No hay ningún evento activo.");

  const gate = consumeActionGate({
    token: gateToken,
    kind: "event",
    targetId: `${state.pendingMissionId}:${choiceId}`,
  });
  if (!gate.ok) return fail(gate.message);

  const choice = state.activeEvent.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) return fail("Decisión desconocida.");

  const updatedSoldier: Soldier = { ...state.soldier };
  if (choice.effects.coins) updatedSoldier.coins = Math.max(0, updatedSoldier.coins + choice.effects.coins);
  if (choice.effects.honor) updatedSoldier.honor = Math.max(0, updatedSoldier.honor + choice.effects.honor);
  if (choice.effects.fatigue) {
    updatedSoldier.fatigue = Math.min(100, Math.max(0, updatedSoldier.fatigue + choice.effects.fatigue));
  }
  if (choice.effects.reputation) {
    updatedSoldier.reputation = Math.max(-50, Math.min(50, updatedSoldier.reputation + choice.effects.reputation));
  }
  if (choice.effects.corruption) {
    updatedSoldier.corruption = Math.min(100, Math.max(0, updatedSoldier.corruption + choice.effects.corruption));
  }
  if (choice.effects.wound) {
    updatedSoldier.wounds = [
      ...updatedSoldier.wounds,
      { id: `${choice.effects.wound}_${Date.now()}`, woundId: choice.effects.wound, treated: false },
    ];
  }

  let brokenEquipmentMessage = "";
  if (choice.effects.breakEquipment) {
    const equippedSlots = (Object.keys(updatedSoldier.equipment) as Array<keyof typeof updatedSoldier.equipment>).filter(
      (slot) => updatedSoldier.equipment[slot] !== null,
    );
    if (equippedSlots.length > 0) {
      const randomSlot = equippedSlots[Math.floor(Math.random() * equippedSlots.length)];
      const brokenItemId = updatedSoldier.equipment[randomSlot];
      if (brokenItemId) {
        const itemDef = getItem(brokenItemId);
        brokenEquipmentMessage = `\n\n[Daño de Equipo] Tu ${itemDef?.name ?? brokenItemId} se rompió por completo debido al esfuerzo y desuso.`;
        updatedSoldier.equipment = { ...updatedSoldier.equipment, [randomSlot]: null };
        updatedSoldier.inventory = updatedSoldier.inventory
          .map((inv) => (inv.itemId === brokenItemId ? { ...inv, quantity: inv.quantity - 1 } : inv))
          .filter((inv) => inv.quantity > 0);
      }
    }
  }

  let inventory: InventoryItem[] = inventoryWithAutoLayout(updatedSoldier.inventory, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
  if (choice.effects.items) {
    for (const drop of choice.effects.items) {
      inventory = addInventoryItem(
        inventory,
        drop.itemId,
        drop.quantity,
        BACKPACK_COLS,
        BACKPACK_ROWS,
        BACKPACK_CHESTS,
      ).inventory;
    }
    updatedSoldier.inventory = inventory;
  }

  const eventHeader = `**[Evento: ${state.activeEvent.title}]**\n${state.activeEvent.text}\n\n*Elección: ${choice.label}*\n${choice.result_text}${brokenEquipmentMessage}\n\n---\n\n`;
  const out = applyMissionRewardsInState(
    { ...state, soldier: updatedSoldier, activeEvent: null, pendingMissionId: null },
    state.pendingMissionId,
  );
  if (!out.result.ok) return out.result as ActionResult<{ state: GameState; reportId?: string }>;
  const reports = out.next.reports.map((report, index) =>
    index === 0 ? { ...report, report: eventHeader + report.report } : report,
  );
  const next = { ...out.next, reports };
  await persistGameState(next);
  revalidateMissionPaths(state.pendingMissionId);
  return ok(out.result.message, { state: next, reportId: out.result.data?.reportId });
}

function revalidateMissionPaths(missionId: string) {
  revalidatePath("/missions");
  revalidatePath(`/missions/${missionId}`);
  revalidatePath("/reports");
  revalidatePath("/soldier");
}
