import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameState, Soldier, MissionResult, StatId, EquipmentSlot, InventoryItem } from "./types";
import { resolveMission } from "./resolver";
import { trainingOptions, getItem, getNextRank, getMission, shopInventory, eventDefinitions } from "./game-data";

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
      corruption: 0,
      banMissionsLeft: 0,
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
    activeEvent: null,
    pendingMissionId: null,
  };
}

export interface GameStore extends GameState {
  trainStat: (stat: StatId) => { ok: boolean; message: string };
  buyItem: (itemId: string) => { ok: boolean; message: string };
  sellItem: (itemId: string) => { ok: boolean; message: string };
  equipItem: (itemId: string) => { ok: boolean; message: string };
  unequipItem: (slot: EquipmentSlot) => { ok: boolean; message: string };
  startMission: (missionId: string) => { ok: boolean; message: string; reportId?: string; eventTriggered?: boolean };
  resolveActiveEventChoice: (choiceId: string) => { ok: boolean; message: string; reportId?: string };
  payTownBribe: () => { ok: boolean; message: string };
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
          const row = shopInventory.find((item) => item.itemId === itemId);
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

          const row = shopInventory.find((item) => item.itemId === itemId);
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
        let result: { ok: boolean; message: string; reportId?: string; eventTriggered?: boolean } = {
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
              eventTriggered: true,
            };
            return {
              soldier: updatedSoldier,
              activeEvent: randomEvent,
              pendingMissionId: missionId,
            };
          }

          // Normal mission resolution (if no event triggered)
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

          // Passive checking: Mutiny due to unpaid wages and high corruption
          let triggeredMutiny = false;
          if (updatedSoldier.unpaidWages >= 3 && updatedSoldier.corruption >= 50 && Math.random() < 0.20) {
            triggeredMutiny = true;
            updatedSoldier.coins += 100;
            updatedSoldier.unpaidWages = 0;
            updatedSoldier.reputation = Math.max(-50, updatedSoldier.reputation - 15);
            updatedSoldier.honor = Math.max(0, updatedSoldier.honor - 10);
            updatedSoldier.banMissionsLeft = 3;

            resolveResult.report += `\n\n[AMOTINAMIENTO Y SAQUEO] Las pagas atrasadas y la falta de disciplina desataron la furia de tus hombres. Para cobrarse los sueldos impagos, la tropa ha saqueado la población vecina. Obtienes 100 doblones de botín de sangre, pero tu reputación e instrucción militar quedan destrozadas. ¡La compañía ha sido expulsada del pueblo!`;
          }

          // Passive checking: Expulsion due to high corruption or bad reputation
          if (!triggeredMutiny && updatedSoldier.banMissionsLeft === 0 && (updatedSoldier.reputation <= -10 || updatedSoldier.corruption >= 80)) {
            if (Math.random() < 0.50) {
              updatedSoldier.banMissionsLeft = 3;
              resolveResult.report += `\n\n¡ALERTA DE DESTIERRO! Tus constantes desmanes y la corrupción acumulada han colmado la paciencia de las autoridades locales. ¡Has sido expulsado del pueblo! No podrás acceder a los servicios locales durante las próximas 3 misiones.`;
            }
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

      resolveActiveEventChoice: (choiceId: string) => {
        let result: { ok: boolean; message: string; reportId?: string } = {
          ok: false,
          message: "No hay ningún evento activo.",
        };
        set((state) => {
          if (!state.activeEvent || !state.pendingMissionId) return {};

          const choice = state.activeEvent.choices.find((c) => c.id === choiceId);
          if (!choice) return {};

          const updatedSoldier = { ...state.soldier };

          // Apply choice effects
          if (choice.effects.coins) updatedSoldier.coins = Math.max(0, updatedSoldier.coins + choice.effects.coins);
          if (choice.effects.honor) updatedSoldier.honor = Math.max(0, updatedSoldier.honor + choice.effects.honor);
          if (choice.effects.fatigue) updatedSoldier.fatigue = Math.min(100, Math.max(0, updatedSoldier.fatigue + choice.effects.fatigue));
          if (choice.effects.reputation) updatedSoldier.reputation = Math.max(-50, Math.min(50, updatedSoldier.reputation + choice.effects.reputation));
          if (choice.effects.corruption) updatedSoldier.corruption = Math.min(100, Math.max(0, updatedSoldier.corruption + choice.effects.corruption));

          // Apply wound if any
          if (choice.effects.wound) {
            updatedSoldier.wounds = [
              ...updatedSoldier.wounds,
              { id: `${choice.effects.wound}_${Date.now()}`, woundId: choice.effects.wound, treated: false },
            ];
          }

          let brokenEquipmentMessage = "";
          // Break random equipped item
          if (choice.effects.breakEquipment) {
            const equippedSlots = (Object.keys(updatedSoldier.equipment) as Array<keyof typeof updatedSoldier.equipment>).filter(
              (slot) => updatedSoldier.equipment[slot] !== null
            );
            if (equippedSlots.length > 0) {
              const randomSlot = equippedSlots[Math.floor(Math.random() * equippedSlots.length)];
              const brokenItemId = updatedSoldier.equipment[randomSlot];
              if (brokenItemId) {
                const itemDef = getItem(brokenItemId);
                brokenEquipmentMessage = `\n\n[Daño de Equipo] Tu ${itemDef?.name ?? brokenItemId} se rompió por completo debido al esfuerzo y desuso.`;
                
                // Unequip
                updatedSoldier.equipment = {
                  ...updatedSoldier.equipment,
                  [randomSlot]: null,
                };

                // Remove 1 from inventory
                updatedSoldier.inventory = updatedSoldier.inventory
                  .map((inv) => (inv.itemId === brokenItemId ? { ...inv, quantity: inv.quantity - 1 } : inv))
                  .filter((inv) => inv.quantity > 0);
              }
            }
          }

          // Add items if any
          if (choice.effects.items) {
            const inventory = [...updatedSoldier.inventory];
            for (const drop of choice.effects.items) {
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
          }

          // Resolve pending mission
          const mission = getMission(state.pendingMissionId);
          if (!mission) return {};

          const resolveResult = resolveMission(updatedSoldier, mission);

          // Append event text and choices to final report
          const eventHeader = `**[Evento: ${state.activeEvent.title}]**\n${state.activeEvent.text}\n\n*Elección: ${choice.label}*\n${choice.result_text}${brokenEquipmentMessage}\n\n---\n\n`;
          resolveResult.report = eventHeader + resolveResult.report;

          // Apply rewards and stats from mission
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

          // Passive checking: Mutiny due to unpaid wages and high corruption
          let triggeredMutiny = false;
          if (updatedSoldier.unpaidWages >= 3 && updatedSoldier.corruption >= 50 && Math.random() < 0.20) {
            triggeredMutiny = true;
            updatedSoldier.coins += 100;
            updatedSoldier.unpaidWages = 0;
            updatedSoldier.reputation = Math.max(-50, updatedSoldier.reputation - 15);
            updatedSoldier.honor = Math.max(0, updatedSoldier.honor - 10);
            updatedSoldier.banMissionsLeft = 3;

            resolveResult.report += `\n\n[AMOTINAMIENTO Y SAQUEO] Las pagas atrasadas y la falta de disciplina desataron la furia de tus hombres. Para cobrarse los sueldos impagos, la tropa ha saqueado la población vecina. Obtienes 100 doblones de botín de sangre, pero tu reputación e instrucción militar quedan destrozadas. ¡La compañía ha sido expulsada del pueblo!`;
          }

          // Passive checking: Expulsion due to high corruption or bad reputation
          if (!triggeredMutiny && updatedSoldier.banMissionsLeft === 0 && (updatedSoldier.reputation <= -10 || updatedSoldier.corruption >= 80)) {
            if (Math.random() < 0.50) {
              updatedSoldier.banMissionsLeft = 3;
              resolveResult.report += `\n\n¡EXPULSIÓN! Los desmanes y la corrupción acumulada han colmado la paciencia del pueblo. ¡Has sido expulsado del campamento! No podrás acceder a los servicios locales durante las próximas 3 misiones.`;
            }
          }

          result = {
            ok: true,
            message: resolveResult.success ? "¡Victoria!" : "Derrota en campaña.",
            reportId: resolveResult.id,
          };

          return {
            soldier: updatedSoldier,
            reports: [resolveResult, ...state.reports],
            activeEvent: null,
            pendingMissionId: null,
          };
        });
        return result;
      },

      payTownBribe: () => {
        let result = { ok: false, message: "No estás expulsado del pueblo." };
        set((state) => {
          if (state.soldier.banMissionsLeft <= 0) return {};
          if (state.soldier.coins < 50) {
            result = { ok: false, message: "No tienes suficientes doblones para sobornar al alguacil." };
            return {};
          }

          const updatedSoldier = {
            ...state.soldier,
            coins: state.soldier.coins - 50,
            banMissionsLeft: 0,
          };
          result = { ok: true, message: "Has sobornado al alguacil. Se levanta el baneo del campamento." };
          return { soldier: updatedSoldier };
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
