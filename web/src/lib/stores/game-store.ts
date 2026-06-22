"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameState } from "../types";
import { createCharacterStates } from "../data/characters";
import {
  addInventoryItem,
  BACKPACK_CHESTS,
  BACKPACK_COLS,
  BACKPACK_ROWS,
  canPlaceItem as canPlaceInventoryItem,
  inventoryWithAutoLayout,
  moveInventoryItem as gridMoveItem,
} from "../domain/inventory-grid";
import { applyMissionRewardsInState } from "../domain/missions";
import {
  buyChurchBlessingInState,
  buyChurchItemInState,
  buyItemInState,
  donateItemInState,
  sellItemInState,
} from "../domain/shop";
import { equipItemInState, unequipItemInState } from "../domain/equipment";
import {
  trainCharacterStatInState,
  trainSoldierStatInState,
} from "../domain/training";
import { treatWoundInState } from "../domain/wounds";
import { fightArenaOpponentInState } from "../domain/arena";
import { recruitCandidateInState } from "../domain/recruitment";
import { eventDefinitions } from "../data/events";
import { getItem, getMission } from "../data";
import type { ActionResult } from "../domain/result";
import type { EquipmentSlot, InventoryItem, StatId } from "../types";
import type { CharacterState, Soldier } from "../types";

const PLAYER_CHARACTER_ID = "diego_de_arce";

function rosterWithSoldier(state: GameState): GameState {
  const baseRoster = state.characters?.length ? state.characters : createCharacterStates();
  const characters = baseRoster.map((character) =>
    character.id === PLAYER_CHARACTER_ID
      ? {
          ...character,
          name: state.soldier.name,
          rank: state.soldier.rank,
          fatigue: state.soldier.fatigue,
          stats: { ...state.soldier.stats },
          equipment: { ...state.soldier.equipment },
        }
      : character,
  );
  return {
    ...state,
    characters,
    activeCharacterId: state.activeCharacterId ?? PLAYER_CHARACTER_ID,
  };
}

export function createInitialState(): GameState {
  const state: GameState = {
    soldier: {
      id: "diego_de_arce",
      name: "Diego de Arce",
      rank: "bisono",
      coins: 25,
      honor: 0,
      xp: 0,
      fatigue: 0,
      unpaidWages: 0,
      reputation: 0,
      corruption: 0,
      banMissionsLeft: 0,
      stats: { pike: 2, sword: 1, arquebus: 1, discipline: 2, vigor: 2, cunning: 1, command: 0 },
      inventory: inventoryWithAutoLayout([
        { itemId: "weapon_pica_gastada_001", quantity: 1 },
        { itemId: "chest_cuirass_001", quantity: 1 },
        { itemId: "consumable_pan_duro_001", quantity: 2 },
        { itemId: "consumable_vendas_001", quantity: 2 },
      ]),
      equipment: {
        head: null,
        body: "chest_cuirass_001",
        mainHand: "weapon_pica_gastada_001",
        offHand: null,
        firearm: null,
        accessory: null,
        boots: null,
        consumable: null,
      },
      wounds: [],
    },
    characters: createCharacterStates(),
    activeCharacterId: PLAYER_CHARACTER_ID,
    reports: [],
    arenaResults: [],
    activeEvent: null,
    pendingMissionId: null,
    // Multiplayer fields stay undefined in single-player state; lib/realtime/*
    // will populate them when Django Channels is wired up.
  };
  return rosterWithSoldier(state);
}

export interface GameStore extends GameState {
  trainStat: (stat: StatId) => ActionResult;
  trainCharacterStat: (characterId: string, stat: StatId) => ActionResult;
  setActiveCharacter: (characterId: string) => void;
  setFormationSlot: (characterId: string, slot: CharacterState["formationSlot"]) => void;
  buyItem: (itemId: string) => ActionResult;
  buyChurchItem: (itemId: string) => ActionResult;
  buyChurchBlessing: (blessingId: string) => ActionResult;
  payChurchErrand: (cost: number) => ActionResult;
  donateItem: (itemId: string) => ActionResult;
  sellItem: (itemId: string) => ActionResult;
  equipItem: (itemId: string) => ActionResult;
  unequipItem: (slot: EquipmentSlot) => ActionResult;
  moveInventoryItem: (itemId: string, x: number, y: number, chest?: number) => ActionResult;
  startMission: (missionId: string) => ActionResult<{ reportId?: string; eventTriggered?: boolean }>;
  fightArenaOpponent: (opponentId: string) => ActionResult<{ resultId?: string }>;
  recruitCandidate: (candidateId: string) => ActionResult;
  resolveActiveEventChoice: (choiceId: string) => ActionResult<{ reportId?: string }>;
  payTownBribe: () => ActionResult;
  treatWound: (woundInstanceId: string) => ActionResult;
  /**
   * Apply a server-pushed event (Django Channels). Today the realtime
   * layer does not exist; the method is here so the WebSocket client
   * will have a single entry point to mutate the store from outside
   * React. Each variant of the ServerEvent union is handled explicitly.
   */
  applyServerEvent: (event: import("../types").ServerEvent) => void;
  resetState: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...createInitialState(),

      trainStat: (stat) => {
        let result: ActionResult = { ok: false, message: "Entrenamiento no encontrado." };
        set((state) => {
          const out = trainSoldierStatInState(state, stat);
          result = out.result;
          return out.next;
        });
        return result;
      },

      trainCharacterStat: (characterId, stat) => {
        let result: ActionResult = { ok: false, message: "Entrenamiento no encontrado." };
        set((state) => {
          const out = trainCharacterStatInState(state, characterId, stat);
          result = out.result;
          return out.next;
        });
        return result;
      },

      setActiveCharacter: (characterId) => {
        set((state) => {
          if (!state.characters.some((character) => character.id === characterId)) return {};
          return { activeCharacterId: characterId };
        });
      },

      setFormationSlot: (characterId, slot) => {
        set((state) => ({
          characters: state.characters.map((character) =>
            character.id === characterId ? { ...character, formationSlot: slot } : character,
          ),
        }));
      },

      buyItem: (itemId) => {
        let result: ActionResult = { ok: false, message: "El objeto no está en venta." };
        set((state) => {
          const out = buyItemInState(state, itemId);
          result = out.result;
          return out.next;
        });
        return result;
      },

      buyChurchItem: (itemId) => {
        let result: ActionResult = { ok: false, message: "El relicario no vende ese objeto." };
        set((state) => {
          const out = buyChurchItemInState(state, itemId);
          result = out.result;
          return out.next;
        });
        return result;
      },

      buyChurchBlessing: (blessingId) => {
        let result: ActionResult = { ok: false, message: "Bendición no encontrada." };
        set((state) => {
          const out = buyChurchBlessingInState(state, blessingId);
          result = out.result;
          return out.next;
        });
        return result;
      },

      payChurchErrand: (cost) => {
        let result: ActionResult = { ok: false, message: "Doblones insuficientes." };
        set((state) => {
          if (state.soldier.coins < cost) {
            result = { ok: false, message: `Doblones insuficientes (${cost}).` };
            return state;
          }
          result = { ok: true, message: `Ofrenda aceptada (${cost} doblones). El capellán anota el encargo.` };
          return {
            ...state,
            soldier: { ...state.soldier, coins: state.soldier.coins - cost },
          };
        });
        return result;
      },

      donateItem: (itemId) => {
        let result: ActionResult = { ok: false, message: "No posees este objeto." };
        set((state) => {
          const out = donateItemInState(state, itemId);
          result = out.result;
          return out.next;
        });
        return result;
      },

      sellItem: (itemId) => {
        let result: ActionResult = { ok: false, message: "No posees este objeto." };
        set((state) => {
          const out = sellItemInState(state, itemId);
          if (out.result.ok) {
            const clearedEquipment = { ...out.next.soldier.equipment };
            for (const slot of Object.keys(clearedEquipment) as Array<keyof typeof clearedEquipment>) {
              if (clearedEquipment[slot] === itemId) clearedEquipment[slot] = null;
            }
            return { ...out.next, soldier: { ...out.next.soldier, equipment: clearedEquipment } };
          }
          result = out.result;
          return out.next;
        });
        return result;
      },

      equipItem: (itemId) => {
        let result: ActionResult = { ok: false, message: "No tienes ese objeto en tu inventario." };
        set((state) => {
          const out = equipItemInState(state, itemId);
          result = out.result;
          return out.next;
        });
        return result;
      },

      unequipItem: (slot) => {
        let result: ActionResult = { ok: false, message: "No hay nada equipado en esta ranura." };
        set((state) => {
          const out = unequipItemInState(state, slot);
          result = out.result;
          return out.next;
        });
        return result;
      },

      moveInventoryItem: (itemId, x, y, chest = 0) => {
        let result: ActionResult = { ok: false, message: "No se puede colocar el objeto." };
        set((state) => {
          const inventory = inventoryWithAutoLayout(state.soldier.inventory, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
          if (!canPlaceInventoryItem(inventory, itemId, x, y, BACKPACK_COLS, BACKPACK_ROWS, itemId, chest)) {
            result = { ok: false, message: "No hay sitio para el objeto." };
            return {};
          }
          const next = gridMoveItem(inventory, itemId, x, y, BACKPACK_COLS, BACKPACK_ROWS, chest);
          const itemDef = getItem(itemId);
          result = { ok: true, message: `Reubicado: ${itemDef?.name ?? itemId}.` };
          return { soldier: { ...state.soldier, inventory: next } };
        });
        return result;
      },

      startMission: (missionId) => {
        let result: ActionResult<{ reportId?: string; eventTriggered?: boolean }> = {
          ok: false,
          message: "Misión desconocida.",
        };
        set((state) => {
          const mission = getMission(missionId);
          if (!mission) return {};

          const updatedSoldier = { ...state.soldier };
          if (updatedSoldier.banMissionsLeft > 0) {
            updatedSoldier.banMissionsLeft = Math.max(0, updatedSoldier.banMissionsLeft - 1);
          }

          // 40% chance of triggering an event
          const shouldTriggerEvent = Math.random() < 0.40 && eventDefinitions.length > 0;
          if (shouldTriggerEvent) {
            const randomEvent = eventDefinitions[Math.floor(Math.random() * eventDefinitions.length)];
            result = {
              ok: true,
              message: "Evento de misión activado.",
              data: { eventTriggered: true },
            };
            return {
              soldier: updatedSoldier,
              activeEvent: randomEvent,
              pendingMissionId: missionId,
            };
          }

          const out = applyMissionRewardsInState({ ...state, soldier: updatedSoldier }, missionId);
          result = out.result;
          return out.next;
        });
        return result;
      },

      fightArenaOpponent: (opponentId) => {
        let result: ActionResult<{ resultId?: string }> = {
          ok: false,
          message: "Rival de arena desconocido.",
        };
        set((state) => {
          const out = fightArenaOpponentInState(state, opponentId);
          result = out.result;
          return out.next;
        });
        return result;
      },

      recruitCandidate: (candidateId) => {
        let result: ActionResult = { ok: false, message: "Recluta no encontrado." };
        set((state) => {
          const out = recruitCandidateInState(state, candidateId);
          result = out.result;
          return out.next;
        });
        return result;
      },

      resolveActiveEventChoice: (choiceId) => {
        let result: ActionResult<{ reportId?: string }> = {
          ok: false,
          message: "No hay ningún evento activo.",
        };
        set((state) => {
          if (!state.activeEvent || !state.pendingMissionId) return {};

          const choice = state.activeEvent.choices.find((c) => c.id === choiceId);
          if (!choice) return {};

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

          const mission = getMission(state.pendingMissionId);
          if (!mission) return {};

          const eventHeader = `**[Evento: ${state.activeEvent.title}]**\n${state.activeEvent.text}\n\n*Elección: ${choice.label}*\n${choice.result_text}${brokenEquipmentMessage}\n\n---\n\n`;

          const out = applyMissionRewardsInState({ ...state, soldier: updatedSoldier, activeEvent: null, pendingMissionId: null }, state.pendingMissionId);
          // Prepend the event narrative to the resulting report text.
          const updatedReports = out.next.reports.map((report, index) =>
            index === 0 ? { ...report, report: eventHeader + report.report } : report,
          );
          result = out.result;
          return { ...out.next, reports: updatedReports };
        });
        return result;
      },

      payTownBribe: () => {
        let result: ActionResult = { ok: false, message: "No estás expulsado del pueblo." };
        set((state) => {
          if (state.soldier.banMissionsLeft <= 0) return {};
          if (state.soldier.coins < 50) {
            result = { ok: false, message: "No tienes suficientes doblones para sobornar al alguacil." };
            return {};
          }
          result = { ok: true, message: "Has sobornado al alguacil. Se levanta el baneo del campamento." };
          return {
            soldier: {
              ...state.soldier,
              coins: state.soldier.coins - 50,
              banMissionsLeft: 0,
            },
          };
        });
        return result;
      },

      treatWound: (woundInstanceId) => {
        let result: ActionResult = { ok: false, message: "No se pudo curar la herida." };
        set((state) => {
          const out = treatWoundInState(state, woundInstanceId);
          result = out.result;
          return out.next;
        });
        return result;
      },

      resetState: () => {
        set({ ...createInitialState() });
      },

      applyServerEvent: (event) => {
        switch (event.type) {
          case "leaderboard.updated":
            set({ leaderboard: event.entries });
            return;
          case "guild.member.joined":
            set((state) => ({
              guildMembers: [
                ...(state.guildMembers ?? []).filter((member) => member.id !== event.member.id),
                event.member,
              ],
            }));
            return;
          case "guild.member.left":
            set((state) => ({
              guildMembers: (state.guildMembers ?? []).filter(
                (member) => member.id !== event.memberId,
              ),
            }));
            return;
          case "notification.new":
            set((state) => ({
              notifications: [event.notification, ...(state.notifications ?? [])],
            }));
            return;
          case "notification.read":
            set((state) => ({
              notifications: (state.notifications ?? []).map((notification) =>
                notification.id === event.notificationId
                  ? { ...notification, read: true }
                  : notification,
              ),
            }));
            return;
          default: {
            // Exhaustiveness check: if a new ServerEvent variant is added
            // without an arm here, TypeScript will flag this assignment.
            const _exhaustive: never = event;
            return _exhaustive;
          }
        }
      },
    }),
    {
      name: "tercio-game-state",
      onRehydrateStorage: () => (rehydrated) => {
        if (!rehydrated) return;
        const soldier = rehydrated.soldier;
        if (!soldier) return;
        const laid = inventoryWithAutoLayout(soldier.inventory ?? [], BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
        soldier.inventory = laid;
        const healed = rosterWithSoldier(rehydrated);
        rehydrated.characters = healed.characters;
        rehydrated.activeCharacterId = healed.activeCharacterId;
      },
    },
  ),
);
