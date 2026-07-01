import { getItem } from "../data/items";
import { getNextStoryChapter, getStoryChapter, PROLOGUE_STORY_ARC_ID, prologueStoryArc } from "../data/story";
import { addInventoryItem, BACKPACK_CHESTS, BACKPACK_COLS, BACKPACK_ROWS, inventoryWithAutoLayout } from "./inventory-grid";
import { fail, ok, type ActionResult } from "./result";
import type { GameState, InventoryItem, Soldier, StoryChoice, StoryProgress, StoryChapter, StoryCharacter, StoryDialogueLine, FamilyBackground } from "../types";

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
  puzzleAnswer,
  now = new Date(),
}: {
  state: GameState;
  chapterId: string;
  choiceId: string;
  puzzleAnswer?: string[];
  now?: Date;
}): { next: GameState; result: ActionResult<{ reportId?: string }> } {
  const progress = normalizeStoryProgress(state.storyProgress);
  const rawChapter = getStoryChapter(chapterId);
  if (!rawChapter) return { next: state, result: fail("Capitulo desconocido.") };

  // Pre-process chapter with character's family background
  const chapter = processChapterForBackground(rawChapter, state.soldier.background, state.soldier.name);

  if (progress.completedChapterIds.includes(chapter.id)) {
    return { next: state, result: fail("Capitulo ya resuelto.") };
  }
  if (progress.currentChapterId !== chapter.id) {
    return { next: state, result: fail("Capitulo bloqueado.") };
  }

  const choice = chapter.choices.find((entry) => entry.id === choiceId);
  if (!choice) return { next: state, result: fail("Decision desconocida.") };

  if (chapter.puzzle) {
    if (!puzzleAnswer || !arraysEqual(puzzleAnswer, chapter.puzzle.answer)) {
      return { next: state, result: fail(chapter.puzzle.failureText || "Resuelve el puzle.") };
    }
  }

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
          report: buildStoryReport(chapter.title, chapter.text, choice, chapter.puzzle?.successText),
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

  const stats = { ...soldier.stats };
  if (choice.effects.stats) {
    for (const [statKey, statValue] of Object.entries(choice.effects.stats)) {
      const key = statKey as keyof typeof stats;
      if (typeof stats[key] === "number") {
        stats[key] = (stats[key] ?? 0) + (statValue ?? 0);
      }
    }
  }

  const equipment = { ...soldier.equipment };
  if (choice.effects.equipment) {
    for (const [eqKey, eqValue] of Object.entries(choice.effects.equipment)) {
      const key = eqKey as keyof typeof equipment;
      equipment[key] = eqValue ?? null;
    }
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
    stats,
    equipment,
  };
}

function buildStoryReport(title: string, text: string, choice: StoryChoice, puzzleSuccessText?: string) {
  let report = `**[Historia: ${title}]**\n${text}\n\n`;
  if (puzzleSuccessText) {
    report += `*Puzle: ${puzzleSuccessText}*\n\n`;
  }
  report += `*Decision: ${choice.label}*\n${choice.resultText}`;
  return report;
}

function arraysEqual(a: string[] | undefined, b: string[] | undefined): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}

export function replaceStoryTextNames(text: string, background?: FamilyBackground, soldierName?: string): string {
  if (!text || !background) return text;
  const brotherFirst = background.brother.name.split(" ")[0];
  const loveFirst = background.love_interest.name.split(" ")[0];
  const grandFirst = background.grandfather.name.split(" ")[0];
  const fatherFirst = background.father.name.split(" ")[0];
  const motherFirst = background.mother.name.split(" ")[0];
  const playerFirst = soldierName ? soldierName.split(" ")[0] : "Diego";
  const playerFull = soldierName || "Diego de Arce";

  return text
    .replace(/Diego de Arce/g, playerFull)
    .replace(/\bDiego\b/g, playerFirst)
    .replace(/\bMartin\b/g, brotherFirst)
    .replace(/\bMartín\b/g, brotherFirst)
    .replace(/\bInes\b/g, loveFirst)
    .replace(/\bInés\b/g, loveFirst)
    .replace(/\bHernan\b/g, grandFirst)
    .replace(/\bHernán\b/g, grandFirst)
    .replace(/\bInes de Orellana\b/g, background.love_interest.name)
    .replace(/\bAbuelo Hernán\b/g, background.grandfather.name)
    .replace(/\bAbuelo Hernan\b/g, background.grandfather.name);
}

export function processChapterForBackground(
  chapter: StoryChapter,
  background?: FamilyBackground,
  soldierName?: string
): StoryChapter {
  if (!background) return chapter;

  const replace = (t: string) => replaceStoryTextNames(t, background, soldierName);

  const characters = chapter.characters?.map((c) => {
    let name = c.name;
    let portraitAssetId = c.portraitAssetId;
    if (c.id === "diego") {
      name = soldierName || c.name;
    } else if (c.id === "martin") {
      name = background.brother.name;
      portraitAssetId = background.brother.portraitId;
    } else if (c.id === "father") {
      name = background.father.name;
      portraitAssetId = background.father.portraitId;
    } else if (c.id === "grandfather") {
      name = background.grandfather.name;
      portraitAssetId = background.grandfather.portraitId;
    } else if (c.id === "ines") {
      name = background.love_interest.name;
      portraitAssetId = background.love_interest.portraitId;
    } else if (c.id === "mother") {
      name = background.mother.name;
      portraitAssetId = background.mother.portraitId;
    }
    return { ...c, name, portraitAssetId };
  }) || [];

  const dialogue = chapter.dialogue?.map((line) => ({
    ...line,
    text: replace(line.text),
  }));

  const choices = chapter.choices.map((choice) => ({
    ...choice,
    label: replace(choice.label),
    resultText: replace(choice.resultText),
  }));

  const puzzle = chapter.puzzle
    ? {
        ...chapter.puzzle,
        title: replace(chapter.puzzle.title),
        prompt: replace(chapter.puzzle.prompt),
        options: chapter.puzzle.options.map((opt) => ({
          ...opt,
          label: replace(opt.label),
          description: opt.description ? replace(opt.description) : undefined,
        })),
        successText: replace(chapter.puzzle.successText),
        failureText: replace(chapter.puzzle.failureText),
      }
    : undefined;

  return {
    ...chapter,
    title: replace(chapter.title),
    text: replace(chapter.text),
    characters,
    dialogue,
    choices,
    puzzle,
  };
}
