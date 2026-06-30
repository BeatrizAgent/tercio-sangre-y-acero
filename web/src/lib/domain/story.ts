import { getItem } from "../data/items";
import { getNextStoryChapter, getStoryChapter, PROLOGUE_STORY_ARC_ID, prologueStoryArc } from "../data/story";
import { addInventoryItem, BACKPACK_CHESTS, BACKPACK_COLS, BACKPACK_ROWS, inventoryWithAutoLayout } from "./inventory-grid";
import { fail, ok, type ActionResult } from "./result";
import type { GameState, InventoryItem, Soldier, StoryChoice, StoryProgress } from "../types";

export function isStoryArcComplete(progress: StoryProgress | undefined): boolean {
  const normalized = normalizeStoryProgress(progress);
  return prologueStoryArc.chapters.every((chapter) => normalized.completedChapterIds.includes(chapter.id));
}

export function getInitialStoryProgress(): StoryProgress {
  return {
    arcId: PROLOGUE_STORY_ARC_ID,
    currentChapterId: prologueStoryArc.chapters[0]?.id ?? "",
    completedChapterIds: [],
    choices: {},
  };
}

export function normalizeStoryProgress(progress: StoryProgress | undefined): StoryProgress {
  if (!progress || progress.arcId !== PROLOGUE_STORY_ARC_ID) return getInitialStoryProgress();
  const current = getStoryChapter(progress.currentChapterId) ? progress.currentChapterId : getInitialStoryProgress().currentChapterId;
  return {
    arcId: PROLOGUE_STORY_ARC_ID,
    currentChapterId: current,
    completedChapterIds: progress.completedChapterIds.filter((id) => Boolean(getStoryChapter(id))),
    choices: { ...progress.choices },
  };
}

export function canResolveStoryChoice(state: GameState, choice: StoryChoice): string | null {
  const requirements = choice.requirements;
  if (!requirements) return null;
  if (requirements.coins && state.soldier.coins < requirements.coins) {
    return `Faltan ${requirements.coins - state.soldier.coins} doblones.`;
  }
  for (const item of requirements.items ?? []) {
    const owned = state.soldier.inventory.find((entry) => entry.itemId === item.itemId)?.quantity ?? 0;
    if (owned < item.quantity) {
      const missing = item.quantity - owned;
      return `Falta ${missing} ${getItem(item.itemId)?.name ?? item.itemId}.`;
    }
  }
  return null;
}

export function resolveStoryChoiceInState({
  state,
  chapterId,
  choiceId,
  now = new Date(),
}: {
  state: GameState;
  chapterId: string;
  choiceId: string;
  now?: Date;
}): { next: GameState; result: ActionResult<{ reportId?: string }> } {
  const progress = normalizeStoryProgress(state.storyProgress);
  const chapter = getStoryChapter(chapterId);
  if (!chapter) return { next: state, result: fail("Capitulo desconocido.") };
  if (progress.completedChapterIds.includes(chapter.id)) {
    return { next: state, result: fail("Capitulo ya resuelto.") };
  }
  if (progress.currentChapterId !== chapter.id) {
    return { next: state, result: fail("Capitulo bloqueado.") };
  }

  const choice = chapter.choices.find((entry) => entry.id === choiceId);
  if (!choice) return { next: state, result: fail("Decision desconocida.") };

  const blocked = canResolveStoryChoice(state, choice);
  if (blocked) return { next: state, result: fail(blocked) };

  const soldier = applyStoryEffects(state.soldier, choice, now);
  const nextChapter = getNextStoryChapter(chapter.id);
  const nextProgress: StoryProgress = {
    arcId: PROLOGUE_STORY_ARC_ID,
    currentChapterId: nextChapter?.id ?? chapter.id,
    completedChapterIds: [...progress.completedChapterIds, chapter.id],
    choices: { ...progress.choices, [chapter.id]: choice.id },
  };
  const reportId = `story_${chapter.id}_${now.getTime()}`;

  return {
    next: {
      ...state,
      soldier,
      storyProgress: nextProgress,
      reports: [
        {
          id: reportId,
          missionId: `story_${chapter.id}`,
          success: true,
          report: buildStoryReport(chapter.title, chapter.text, choice),
          rewards: {
            coins: choice.effects.coins ?? 0,
            xp: choice.effects.xp ?? 0,
            honor: choice.effects.honor ?? 0,
          },
          fatigue: choice.effects.fatigue ?? 0,
          wounds: choice.effects.wound ? [choice.effects.wound] : [],
          loot: choice.effects.items?.map((item) => ({ itemId: item.itemId, quantity: item.quantity })) ?? [],
          createdAt: now.toISOString(),
        },
        ...state.reports,
      ],
    },
    result: ok(nextChapter ? "Capitulo resuelto." : "Prologo completado.", { reportId }),
  };
}

function applyStoryEffects(soldier: Soldier, choice: StoryChoice, now: Date): Soldier {
  let inventory: InventoryItem[] = inventoryWithAutoLayout(soldier.inventory, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);

  for (const item of choice.requirements?.items ?? []) {
    inventory = inventory
      .map((entry) => (entry.itemId === item.itemId ? { ...entry, quantity: entry.quantity - item.quantity } : entry))
      .filter((entry) => entry.quantity > 0);
  }

  for (const item of choice.effects.items ?? []) {
    inventory = addInventoryItem(inventory, item.itemId, item.quantity, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS).inventory;
  }

  return {
    ...soldier,
    coins: Math.max(0, soldier.coins + (choice.effects.coins ?? 0)),
    xp: Math.max(0, soldier.xp + (choice.effects.xp ?? 0)),
    honor: soldier.honor + (choice.effects.honor ?? 0),
    fatigue: Math.min(100, Math.max(0, soldier.fatigue + (choice.effects.fatigue ?? 0))),
    reputation: Math.max(-50, Math.min(50, soldier.reputation + (choice.effects.reputation ?? 0))),
    corruption: Math.min(100, Math.max(0, soldier.corruption + (choice.effects.corruption ?? 0))),
    wounds: choice.effects.wound
      ? [...soldier.wounds, { id: `${choice.effects.wound}_${now.getTime()}`, woundId: choice.effects.wound, treated: false }]
      : soldier.wounds,
    inventory,
  };
}

function buildStoryReport(title: string, text: string, choice: StoryChoice) {
  return `**[Historia: ${title}]**\n${text}\n\n*Decision: ${choice.label}*\n${choice.resultText}`;
}
