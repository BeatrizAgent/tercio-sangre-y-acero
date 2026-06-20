import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ArenaResult, EquipmentSlot, GameState, StatId } from "./types";
import { resolveMission } from "./domain/resolver";
import {
  createCharacterStates,
  churchBlessings,
  churchInventory,
  trainingOptions,
  getItem,
  getNextRank,
  getMission,
  shopInventory,
  eventDefinitions,
  getArenaOpponent,
  getEquipmentBonuses,
} from "./game-data";
import {
  BACKPACK_COLS,
  BACKPACK_CHESTS,
  BACKPACK_ROWS,
  addInventoryItem,
  canPlaceItem,
  inventoryWithAutoLayout,
  moveInventoryItem as gridMoveItem,
} from "./domain/inventory-grid";
import { recruitCandidateIntoState } from "./recruitment";

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
      stats: {
        pike: 2,
        sword: 1,
        arquebus: 1,
        discipline: 2,
        vigor: 2,
        cunning: 1,
        command: 0,
      },
      inventory: inventoryWithAutoLayout([
        { itemId: "common_pike_001", quantity: 1 },
        { itemId: "armadura_003", quantity: 1 },
        { itemId: "objeto_004", quantity: 2 },
        { itemId: "objeto_002", quantity: 2 },
      ]),
      equipment: {
        head: null,
        body: "armadura_003",
        mainHand: "common_pike_001",
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
  };
  return rosterWithSoldier(state);
}

export interface GameStore extends GameState {
  trainStat: (stat: StatId) => { ok: boolean; message: string };
  trainCharacterStat: (characterId: string, stat: StatId) => { ok: boolean; message: string };
  setActiveCharacter: (characterId: string) => void;
  setFormationSlot: (characterId: string, slot: GameState["characters"][number]["formationSlot"]) => void;
  buyItem: (itemId: string) => { ok: boolean; message: string };
  buyChurchItem: (itemId: string) => { ok: boolean; message: string };
  buyChurchBlessing: (blessingId: string) => { ok: boolean; message: string };
  sellItem: (itemId: string) => { ok: boolean; message: string };
  equipItem: (itemId: string) => { ok: boolean; message: string };
  unequipItem: (slot: EquipmentSlot) => { ok: boolean; message: string };
  moveInventoryItem: (itemId: string, x: number, y: number, chest?: number) => { ok: boolean; message: string };
  startMission: (missionId: string) => { ok: boolean; message: string; reportId?: string; eventTriggered?: boolean };
  fightArenaOpponent: (opponentId: string) => { ok: boolean; message: string; resultId?: string };
  recruitCandidate: (candidateId: string) => { ok: boolean; message: string };
  resolveActiveEventChoice: (choiceId: string) => { ok: boolean; message: string; reportId?: string };
  payTownBribe: () => { ok: boolean; message: string };
  treatWound: (woundInstanceId: string) => { ok: boolean; message: string };
  resetState: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
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
          return {
            soldier: updatedSoldier,
            characters: state.characters.map((character) =>
              character.id === PLAYER_CHARACTER_ID
                ? {
                    ...character,
                    rank: updatedSoldier.rank,
                    fatigue: updatedSoldier.fatigue,
                    stats: { ...updatedSoldier.stats },
                    equipment: { ...updatedSoldier.equipment },
                  }
                : character,
            ),
          };
        });
        return result;
      },

      trainCharacterStat: (characterId: string, stat: StatId) => {
        let result = { ok: false, message: "Entrenamiento no encontrado." };
        set((state) => {
          const option = trainingOptions.find((entry) => entry.stat === stat);
          if (!option) return {};
          if (state.soldier.coins < option.cost.coins || state.soldier.xp < option.cost.xp) {
            result = { ok: false, message: "Monedas o experiencia insuficientes." };
            return {};
          }
          const character = state.characters.find((entry) => entry.id === characterId);
          if (!character) {
            result = { ok: false, message: "Personaje no encontrado." };
            return {};
          }

          const updatedCharacter = {
            ...character,
            fatigue: Math.min(100, character.fatigue + option.fatigue),
            stats: {
              ...character.stats,
              [stat]: character.stats[stat] + option.gain,
            },
          };
          const characters = state.characters.map((entry) => (entry.id === characterId ? updatedCharacter : entry));
          const updatedSoldier =
            characterId === PLAYER_CHARACTER_ID
              ? {
                  ...state.soldier,
                  coins: state.soldier.coins - option.cost.coins,
                  xp: state.soldier.xp - option.cost.xp,
                  fatigue: updatedCharacter.fatigue,
                  stats: { ...updatedCharacter.stats },
                  equipment: { ...updatedCharacter.equipment },
                }
              : {
                  ...state.soldier,
                  coins: state.soldier.coins - option.cost.coins,
                  xp: state.soldier.xp - option.cost.xp,
                };

          result = { ok: true, message: `${updatedCharacter.name} completa: ${option.name}.` };
          return { soldier: updatedSoldier, characters };
        });
        return result;
      },

      setActiveCharacter: (characterId: string) => {
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

      buyItem: (itemId: string) => {
        let result = { ok: false, message: "El objeto no est? en venta." };
        set((state) => {
          const row = shopInventory.find((item) => item.itemId === itemId);
          if (!row) return {};
          if (state.soldier.coins < row.buyPrice) {
            result = { ok: false, message: "Monedas insuficientes." };
            return {};
          }

          const inserted = addInventoryItem(state.soldier.inventory, itemId, 1, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
          if (!inserted.ok) {
            result = { ok: false, message: "No hay espacio en ning?n ba?l." };
            return {};
          }

          const itemDef = getItem(itemId);
          result = { ok: true, message: `Has comprado: ${itemDef?.name ?? itemId}.` };
          return {
            soldier: {
              ...state.soldier,
              coins: state.soldier.coins - row.buyPrice,
              inventory: inserted.inventory,
            },
          };
        });
        return result;
      },

      buyChurchItem: (itemId: string) => {
        let result = { ok: false, message: "El relicario no vende ese objeto." };
        set((state) => {
          const row = churchInventory.find((item) => item.itemId === itemId);
          if (!row) return {};
          if (state.soldier.coins < row.buyPrice) {
            result = { ok: false, message: "Doblones insuficientes para el relicario." };
            return {};
          }

          const inserted = addInventoryItem(state.soldier.inventory, itemId, 1, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
          if (!inserted.ok) {
            result = { ok: false, message: "No hay hueco en ningun baul." };
            return {};
          }

          const itemDef = getItem(itemId);
          result = { ok: true, message: `Has comprado en la iglesia: ${itemDef?.name ?? itemId}.` };
          return {
            soldier: {
              ...state.soldier,
              coins: state.soldier.coins - row.buyPrice,
              inventory: inserted.inventory,
            },
          };
        });
        return result;
      },

      buyChurchBlessing: (blessingId: string) => {
        let result = { ok: false, message: "Bendicion no encontrada." };
        set((state) => {
          const blessing = churchBlessings.find((entry) => entry.id === blessingId);
          if (!blessing) return {};
          if (state.soldier.coins < blessing.cost) {
            result = { ok: false, message: "Doblones insuficientes para la ofrenda." };
            return {};
          }
          const effects: Partial<Record<"honor" | "fatigue" | "reputation" | "corruption", number>> = blessing.effects;

          const updatedSoldier = {
            ...state.soldier,
            coins: state.soldier.coins - blessing.cost,
            honor: Math.max(0, state.soldier.honor + Number(effects.honor ?? 0)),
            fatigue: Math.max(0, Math.min(100, state.soldier.fatigue + Number(effects.fatigue ?? 0))),
            reputation: Math.max(-50, Math.min(50, state.soldier.reputation + Number(effects.reputation ?? 0))),
            corruption: Math.max(0, Math.min(100, state.soldier.corruption + Number(effects.corruption ?? 0))),
          };

          result = { ok: true, message: `${blessing.name}: el capellan hace la senal y cobra la ofrenda.` };
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

          const owned = inventory[ownedIdx];
          if (owned.quantity > 1) {
            inventory[ownedIdx] = { ...owned, quantity: owned.quantity - 1 };
            updatedSoldier.inventory = inventory;
          } else {
            const kept = inventory.filter((_, idx) => idx !== ownedIdx);
            updatedSoldier.inventory = kept;
          }
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

      moveInventoryItem: (itemId: string, x: number, y: number, chest: number = 0) => {
        let result = { ok: false, message: "No se puede colocar el objeto." };
        set((state) => {
          const inventory = inventoryWithAutoLayout(state.soldier.inventory, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
          if (!canPlaceItem(inventory, itemId, x, y, BACKPACK_COLS, BACKPACK_ROWS, itemId, chest)) {
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

          let inventory = inventoryWithAutoLayout(updatedSoldier.inventory, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
          for (const drop of resolveResult.loot) {
            inventory = addInventoryItem(inventory, drop.itemId, drop.quantity, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS).inventory;
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

      fightArenaOpponent: (opponentId: string) => {
        let result: { ok: boolean; message: string; resultId?: string } = {
          ok: false,
          message: "Rival de arena desconocido.",
        };
        set((state) => {
          const opponent = getArenaOpponent(opponentId);
          if (!opponent) return {};

          const updatedSoldier = { ...state.soldier };
          if (updatedSoldier.fatigue >= 100) {
            result = { ok: false, message: "Diego esta demasiado agotado para batirse en la arena." };
            return {};
          }

          const equipmentBonuses = getEquipmentBonuses(updatedSoldier.equipment);
          const untreatedWounds = updatedSoldier.wounds.filter((wound) => !wound.treated).length;
          const arenaPower =
            updatedSoldier.stats.sword +
            updatedSoldier.stats.pike +
            updatedSoldier.stats.vigor +
            updatedSoldier.stats.discipline +
            updatedSoldier.stats.command +
            Number(equipmentBonuses.sword ?? 0) +
            Number(equipmentBonuses.pike ?? 0) +
            Number(equipmentBonuses.vigor ?? 0) +
            Number(equipmentBonuses.discipline ?? 0) -
            untreatedWounds * 2 -
            Math.floor(updatedSoldier.fatigue / 12);
          const roll = Math.floor(Math.random() * 6) + 1;
          const success = arenaPower + roll >= opponent.power;
          const rewards = {
            coins: success ? opponent.rewards.coins : Math.max(1, Math.floor(opponent.rewards.coins / 3)),
            xp: success ? opponent.rewards.xp : Math.max(1, Math.floor(opponent.rewards.xp / 2)),
            honor: success ? opponent.rewards.honor : 0,
          };
          const wounds =
            !success || opponent.woundChance + updatedSoldier.fatigue >= 45
              ? ["broken_rib"]
              : [];

          updatedSoldier.coins += rewards.coins;
          updatedSoldier.xp += rewards.xp;
          updatedSoldier.honor += rewards.honor;
          updatedSoldier.fatigue = Math.min(100, updatedSoldier.fatigue + opponent.fatigue);
          if (wounds.length > 0) {
            updatedSoldier.wounds = [
              ...updatedSoldier.wounds,
              ...wounds.map((woundId) => ({ id: `${woundId}_${Date.now()}`, woundId, treated: false })),
            ];
          }

          const nextRank = getNextRank(updatedSoldier.xp, updatedSoldier.honor);
          if (nextRank) {
            updatedSoldier.rank = nextRank.id;
          }

          const arenaResult: ArenaResult = {
            id: `arena_${Date.now()}`,
            opponentId: opponent.id,
            success,
            report: success
              ? `Diego aguanta el primer choque contra ${opponent.name}, encuentra hueco entre polvo y gritos, y gana el duelo.`
              : `${opponent.name} castiga la guardia de Diego. Hay paga pequena por presentarse, pero ningun honor.`,
            rewards,
            fatigue: opponent.fatigue,
            wounds,
            createdAt: new Date().toISOString(),
          };

          result = {
            ok: true,
            message: success ? "Victoria en la arena." : "Derrota en la arena.",
            resultId: arenaResult.id,
          };

          return {
            soldier: updatedSoldier,
            arenaResults: [arenaResult, ...(state.arenaResults ?? [])],
          };
        });
        return result;
      },

      recruitCandidate: (candidateId: string) => {
        let result = { ok: false, message: "Recluta no encontrado." };
        set((state) => {
          const recruited = recruitCandidateIntoState(state, candidateId);
          result = { ok: recruited.ok, message: recruited.message };
          return recruited.state;
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
            let inventory = inventoryWithAutoLayout(updatedSoldier.inventory, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
            for (const drop of choice.effects.items) {
              inventory = addInventoryItem(inventory, drop.itemId, drop.quantity, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS).inventory;
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

          let inventory = inventoryWithAutoLayout(updatedSoldier.inventory, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
          for (const drop of resolveResult.loot) {
            inventory = addInventoryItem(inventory, drop.itemId, drop.quantity, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS).inventory;
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
          const bandageIdx = inventory.findIndex((item) => item.itemId === "objeto_002");
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
    }
  )
);
