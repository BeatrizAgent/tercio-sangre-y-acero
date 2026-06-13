import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameState, Soldier, MissionResult, StatId, EquipmentSlot, InventoryItem } from "./types";
import { resolveMission } from "./resolver";
import { trainingOptions, getItem, getNextRank, getMission } from "./game-data";

export function createInitialState(): GameState {
  return {
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
      stats: {
        pike: 2,
        sword: 1,
        arquebus: 1,
        discipline: 2,
        vigor: 2,
        cunning: 1,
        command: 0,
      },
      inventory: [
        { itemId: "rusty_pike", quantity: 1 },
        { itemId: "patched_doublet", quantity: 1 },
        { itemId: "hard_bread", quantity: 2 },
        { itemId: "clean_bandage", quantity: 2 },
      ],
      equipment: {
        head: null,
        body: "patched_doublet",
        mainHand: "rusty_pike",
        offHand: null,
        firearm: null,
        accessory: null,
        boots: null,
        consumable: null,
      },
      wounds: [],
    },
    reports: [],
  };
}

export interface GameStore extends GameState {
  trainStat: (stat: StatId) => { ok: boolean; message: string };
  buyItem: (itemId: string) => { ok: boolean; message: string };
  sellItem: (itemId: string) => { ok: boolean; message: string };
  equipItem: (itemId: string) => { ok: boolean; message: string };
  unequipItem: (slot: EquipmentSlot) => { ok: boolean; message: string };
  startMission: (missionId: string) => { ok: boolean; message: string; reportId?: string };
  treatWound: (woundInstanceId: string) => { ok: boolean; message: string };
  resetState: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      trainStat: (stat: StatId) => {
        let result = { ok: false, message: "Entrenamiento no encontrado." };
        set((state) => {
          const option = trainingOptions.find((entry) => entry.stat === stat);
          if (!option) return {};
          if (state.soldier.coins < option.cost.coins || state.soldier.xp < option.cost.xp) {
            result = { ok: false, message: "Monedas o experiencia insuficientes." };
            return {};
          }
          const updatedSoldier = { ...state.soldier };
          updatedSoldier.coins -= option.cost.coins;
          updatedSoldier.xp -= option.cost.xp;
          updatedSoldier.stats = {
            ...updatedSoldier.stats,
            [stat]: updatedSoldier.stats[stat] + option.gain,
          };
          updatedSoldier.fatigue = Math.min(100, updatedSoldier.fatigue + option.fatigue);
          result = { ok: true, message: `Has completado el entrenamiento: ${option.name}.` };
          return { soldier: updatedSoldier };
        });
        return result;
      },

      buyItem: (itemId: string) => {
        let result = { ok: false, message: "El objeto no está en venta." };
        set((state) => {
          const shopItems = [
            { itemId: "rusty_pike", buyPrice: 18, sellPrice: 8 },
            { itemId: "chipped_sword", buyPrice: 22, sellPrice: 10 },
            { itemId: "worn_arquebus", buyPrice: 42, sellPrice: 20 },
            { itemId: "cheap_morion", buyPrice: 20, sellPrice: 8 },
            { itemId: "dented_cuirass", buyPrice: 45, sellPrice: 20 },
            { itemId: "old_boots", buyPrice: 12, sellPrice: 5 },
            { itemId: "clean_bandage", buyPrice: 9, sellPrice: 4 },
            { itemId: "wine_skin", buyPrice: 7, sellPrice: 3 },
            { itemId: "hard_bread", buyPrice: 3, sellPrice: 1 },
          ];
          const row = shopItems.find((item) => item.itemId === itemId);
          if (!row) return {};
          if (state.soldier.coins < row.buyPrice) {
            result = { ok: false, message: "Monedas insuficientes." };
            return {};
          }
          const updatedSoldier = { ...state.soldier };
          updatedSoldier.coins -= row.buyPrice;
          
          const inventory = [...updatedSoldier.inventory];
          const ownedIdx = inventory.findIndex((item) => item.itemId === itemId);
          if (ownedIdx > -1) {
            inventory[ownedIdx] = {
              ...inventory[ownedIdx],
              quantity: inventory[ownedIdx].quantity + 1,
            };
          } else {
            inventory.push({ itemId, quantity: 1 });
          }
          updatedSoldier.inventory = inventory;

          const itemDef = getItem(itemId);
          result = { ok: true, message: `Has comprado: ${itemDef?.name ?? itemId}.` };
          return { soldier: updatedSoldier };
        });
        return result;
      },

      sellItem: (itemId: string) => {
        let result = { ok: false, message: "No posees este objeto." };
        set((state) => {
          const updatedSoldier = { ...state.soldier };
          const inventory = [...updatedSoldier.inventory];
          const ownedIdx = inventory.findIndex((item) => item.itemId === itemId);
          if (ownedIdx === -1 || inventory[ownedIdx].quantity < 1) return {};

          const shopItems = [
            { itemId: "rusty_pike", buyPrice: 18, sellPrice: 8 },
            { itemId: "chipped_sword", buyPrice: 22, sellPrice: 10 },
            { itemId: "worn_arquebus", buyPrice: 42, sellPrice: 20 },
            { itemId: "cheap_morion", buyPrice: 20, sellPrice: 8 },
            { itemId: "dented_cuirass", buyPrice: 45, sellPrice: 20 },
            { itemId: "old_boots", buyPrice: 12, sellPrice: 5 },
            { itemId: "clean_bandage", buyPrice: 9, sellPrice: 4 },
            { itemId: "wine_skin", buyPrice: 7, sellPrice: 3 },
            { itemId: "hard_bread", buyPrice: 3, sellPrice: 1 },
          ];
          const row = shopItems.find((item) => item.itemId === itemId);
          const value = row?.sellPrice ?? Math.max(1, Math.floor((getItem(itemId)?.value ?? 1) / 2));

          inventory[ownedIdx] = {
            ...inventory[ownedIdx],
            quantity: inventory[ownedIdx].quantity - 1,
          };
          updatedSoldier.inventory = inventory.filter((item) => item.quantity > 0);
          updatedSoldier.coins += value;

          const itemDef = getItem(itemId);
          result = { ok: true, message: `Has vendido: ${itemDef?.name ?? itemId}.` };
          return { soldier: updatedSoldier };
        });
        return result;
      },

      equipItem: (itemId: string) => {
        let result = { ok: false, message: "No tienes ese objeto en tu inventario." };
        set((state) => {
          const updatedSoldier = { ...state.soldier };
          const item = getItem(itemId);
          if (!item) return {};
          if (!updatedSoldier.inventory.some((owned) => owned.itemId === itemId && owned.quantity > 0)) {
            return {};
          }
          const equipment = { ...updatedSoldier.equipment };
          const slot = item.slot;

          equipment[slot] = itemId;
          updatedSoldier.equipment = equipment;

          result = { ok: true, message: `Equipado: ${item.name}.` };
          return { soldier: updatedSoldier };
        });
        return result;
      },

      unequipItem: (slot: EquipmentSlot) => {
        let result = { ok: false, message: "No hay nada equipado en esta ranura." };
        set((state) => {
          const updatedSoldier = { ...state.soldier };
          const equipment = { ...updatedSoldier.equipment };
          if (!equipment[slot]) return {};

          equipment[slot] = null;
          updatedSoldier.equipment = equipment;
          result = { ok: true, message: `Desequipado con éxito.` };
          return { soldier: updatedSoldier };
        });
        return result;
      },

      startMission: (missionId: string) => {
        let result: { ok: boolean; message: string; reportId?: string } = {
          ok: false,
          message: "Misión desconocida.",
        };
        set((state) => {
          const mission = getMission(missionId);
          if (!mission) return {};

          const updatedSoldier = { ...state.soldier };
          const resolveResult = resolveMission(updatedSoldier, mission);

          updatedSoldier.coins += resolveResult.rewards.coins;
          updatedSoldier.xp += resolveResult.rewards.xp;
          updatedSoldier.honor += resolveResult.rewards.honor;
          updatedSoldier.fatigue = Math.min(100, updatedSoldier.fatigue + resolveResult.fatigue);

          const wounds = [...updatedSoldier.wounds];
          for (const woundId of resolveResult.wounds) {
            wounds.push({ id: `${woundId}_${Date.now()}`, woundId, treated: false });
          }
          updatedSoldier.wounds = wounds;

          const inventory = [...updatedSoldier.inventory];
          for (const drop of resolveResult.loot) {
            const ownedIdx = inventory.findIndex((item) => item.itemId === drop.itemId);
            if (ownedIdx > -1) {
              inventory[ownedIdx] = {
                ...inventory[ownedIdx],
                quantity: inventory[ownedIdx].quantity + drop.quantity,
              };
            } else {
              inventory.push({ itemId: drop.itemId, quantity: drop.quantity });
            }
          }
          updatedSoldier.inventory = inventory;

          const nextRank = getNextRank(updatedSoldier.xp, updatedSoldier.honor);
          if (nextRank) {
            updatedSoldier.rank = nextRank.id;
          }

          result = {
            ok: true,
            message: resolveResult.success ? "¡Victoria!" : "Derrota en campaña.",
            reportId: resolveResult.id,
          };

          return {
            soldier: updatedSoldier,
            reports: [resolveResult, ...state.reports],
          };
        });
        return result;
      },

      treatWound: (woundInstanceId: string) => {
        let result = { ok: false, message: "No se pudo curar la herida." };
        set((state) => {
          const updatedSoldier = { ...state.soldier };
          const inventory = [...updatedSoldier.inventory];
          const bandageIdx = inventory.findIndex((item) => item.itemId === "clean_bandage");
          if (bandageIdx === -1 || inventory[bandageIdx].quantity < 1) {
            result = { ok: false, message: "No tienes vendas limpias disponibles." };
            return {};
          }

          const wounds = [...updatedSoldier.wounds];
          const woundIdx = wounds.findIndex((entry) => entry.id === woundInstanceId);
          if (woundIdx === -1) {
            result = { ok: false, message: "Herida no encontrada." };
            return {};
          }

          wounds[woundIdx] = { ...wounds[woundIdx], treated: true };
          updatedSoldier.wounds = wounds;

          inventory[bandageIdx] = {
            ...inventory[bandageIdx],
            quantity: inventory[bandageIdx].quantity - 1,
          };
          updatedSoldier.inventory = inventory.filter((item) => item.quantity > 0);

          result = { ok: true, message: "Herida vendada con éxito." };
          return { soldier: updatedSoldier };
        });
        return result;
      },

      resetState: () => {
        set({
          ...createInitialState(),
        });
      },
    }),
    {
      name: "tercio-game-state",
    }
  )
);
