import assert from "node:assert/strict";
import { prologueStoryArc } from "../../src/lib/data/story";
import {
  getInitialStoryProgress,
  isStoryArcComplete,
  resolveStoryChoiceInState,
} from "../../src/lib/domain/story";
import { createTestState, withCoins } from "../helpers/state-fixtures";

{
  assert.equal(prologueStoryArc.chapters.length, 8, "prologue has eight chapters");
  assert.equal(prologueStoryArc.title, "Capitulo 1: La leva de Castilla", "story arc is chapter 1");
  assert.equal(prologueStoryArc.chapters[0]?.id, "cap1_choza_castellana", "chapter 1 starts at the family hut");
  assert.deepEqual(
    prologueStoryArc.chapters.filter((chapter) => chapter.puzzle).map((chapter) => chapter.puzzle?.kind),
    ["sequence"],
    "chapter 1 keeps only the early tutorial puzzle",
  );
  assert.ok(
    prologueStoryArc.chapters.filter((chapter) => chapter.mature).every((chapter) => chapter.presentation === "blurred"),
    "mature chapters stay blurred",
  );
}

{
  const state = {
    ...withCoins(createTestState(), 0),
    storyProgress: {
      arcId: "prologue_castilla",
      currentChapterId: "cap1_talega_temporero",
      completedChapterIds: ["cap1_choza_castellana", "cap1_recuerdo_madre", "cap1_padre_sombra"],
      choices: {
        cap1_choza_castellana: "shield_brother",
        cap1_recuerdo_madre: "sing_low",
        cap1_padre_sombra: "endure_silence",
      },
    },
  };
  const beforeCompleted = state.storyProgress.completedChapterIds.length;
  const out = resolveStoryChoiceInState({
    state,
    chapterId: "cap1_talega_temporero",
    choiceId: "pack_for_two",
    now: new Date("2026-06-30T10:00:00.000Z"),
  });

  assert.equal(out.result.ok, true, "late story choice resolves without puzzle friction");
  assert.equal(out.next.soldier.coins, 0, "direct story choice does not require coins");
  assert.equal(out.next.storyProgress?.completedChapterIds.length ?? 0, beforeCompleted + 1, "direct story choice progresses");
}

{
  const state = createTestState();
  const out = resolveStoryChoiceInState({
    state,
    chapterId: "cap1_choza_castellana",
    choiceId: "shield_brother",
    now: new Date("2026-06-30T10:00:00.000Z"),
  });

  assert.equal(out.result.ok, true, "valid choice resolves");
  assert.equal(out.next.soldier.xp, state.soldier.xp + 5, "story grants xp");
  assert.equal(out.next.storyProgress?.currentChapterId, "cap1_recuerdo_madre", "next chapter unlocks");
  assert.equal(out.next.storyProgress?.choices.cap1_choza_castellana, "shield_brother", "choice recorded");
  assert.equal(out.next.reports[0]?.missionId, "story_cap1_choza_castellana", "story creates report");
}

{
  const state = {
    ...createTestState(),
    storyProgress: {
      arcId: "prologue_castilla",
      currentChapterId: "cap1_recuerdo_madre",
      completedChapterIds: ["cap1_choza_castellana"],
      choices: { cap1_choza_castellana: "shield_brother" },
    },
  };
  const out = resolveStoryChoiceInState({
    state,
    chapterId: "cap1_recuerdo_madre",
    choiceId: "sing_low",
    puzzleAnswer: ["mantilla", "rosary", "lullaby"],
    now: new Date("2026-06-30T10:00:00.000Z"),
  });

  assert.equal(out.result.ok, true, "valid sequence puzzle resolves");
  assert.match(out.next.reports[0]?.report ?? "", /Puzle: El orden calma al nino/);
}

{
  const state = {
    ...createTestState(),
    storyProgress: {
      arcId: "prologue_castilla",
      currentChapterId: "cap1_recuerdo_madre",
      completedChapterIds: ["cap1_choza_castellana"],
      choices: { cap1_choza_castellana: "shield_brother" },
    },
  };
  const out = resolveStoryChoiceInState({
    state,
    chapterId: "cap1_recuerdo_madre",
    choiceId: "sing_low",
    puzzleAnswer: ["lullaby", "mantilla", "rosary"],
    now: new Date("2026-06-30T10:00:00.000Z"),
  });

  assert.equal(out.result.ok, false, "invalid puzzle answer blocks story");
  assert.match(out.result.message, /Resuelve el puzle/);
}

{
  const first = resolveStoryChoiceInState({
    state: createTestState(),
    chapterId: "cap1_choza_castellana",
    choiceId: "shield_brother",
    now: new Date("2026-06-30T10:00:00.000Z"),
  });
  const second = resolveStoryChoiceInState({
    state: first.next,
    chapterId: "cap1_choza_castellana",
    choiceId: "shield_brother",
    now: new Date("2026-06-30T10:01:00.000Z"),
  });

  assert.equal(second.result.ok, false, "completed chapter cannot be farmed");
  assert.equal(second.next.soldier.xp, first.next.soldier.xp, "repeat gives no xp");
}

{
  const progress = getInitialStoryProgress();
  assert.equal(progress.arcId, "prologue_castilla");
  assert.equal(progress.currentChapterId, "cap1_choza_castellana");
  assert.deepEqual(progress.completedChapterIds, []);
  assert.equal(isStoryArcComplete(progress), false, "new story is not complete");
}

{
  let state = createTestState();
  for (const chapter of prologueStoryArc.chapters) {
    const choice = chapter.choices.find((entry) => {
      if (entry.requirements?.coins && state.soldier.coins < entry.requirements.coins) return false;
      for (const item of entry.requirements?.items ?? []) {
        const owned = state.soldier.inventory.find((inventoryItem) => inventoryItem.itemId === item.itemId)?.quantity ?? 0;
        if (owned < item.quantity) return false;
      }
      return true;
    });
    assert.ok(choice, `chapter ${chapter.id} has a reachable choice`);
    const out = resolveStoryChoiceInState({
      state,
      chapterId: chapter.id,
      choiceId: choice.id,
      puzzleAnswer: chapter.puzzle?.answer,
      now: new Date("2026-06-30T10:00:00.000Z"),
    });
    assert.equal(out.result.ok, true, `${chapter.id} resolves`);
    state = out.next;
  }

  assert.equal(isStoryArcComplete(state.storyProgress), true, "full prologue can be completed");
  assert.equal(state.storyProgress?.completedChapterIds.length, prologueStoryArc.chapters.length);
  assert.equal(state.reports.length, prologueStoryArc.chapters.length, "each chapter creates a report");
}

console.log(JSON.stringify({ ok: true, checked: "story" }, null, 2));
