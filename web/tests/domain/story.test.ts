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
      currentChapterId: "prologue_debt",
      completedChapterIds: ["prologue_village", "prologue_recruiter"],
      choices: { prologue_village: "take_bread", prologue_recruiter: "ask_terms" },
    },
  };
  const beforeCompleted = state.storyProgress.completedChapterIds.length;
  const out = resolveStoryChoiceInState({
    state,
    chapterId: "prologue_debt",
    choiceId: "pay_recruiter",
    now: new Date("2026-06-30T10:00:00.000Z"),
  });

  assert.equal(out.result.ok, false, "choice blocked without coins");
  assert.match(out.result.message, /Faltan 8 doblones/);
  assert.equal(out.next.soldier.coins, 0, "blocked choice does not spend coins");
  assert.equal(out.next.storyProgress?.completedChapterIds.length ?? 0, beforeCompleted, "blocked choice does not progress");
}

{
  const state = createTestState();
  const out = resolveStoryChoiceInState({
    state,
    chapterId: "prologue_village",
    choiceId: "take_bread",
    now: new Date("2026-06-30T10:00:00.000Z"),
  });

  assert.equal(out.result.ok, true, "valid choice resolves");
  assert.equal(out.next.soldier.xp, state.soldier.xp + 6, "story grants xp");
  assert.equal(out.next.soldier.coins, state.soldier.coins + 2, "story grants coins");
  assert.equal(out.next.storyProgress?.currentChapterId, "prologue_recruiter", "next chapter unlocks");
  assert.equal(out.next.storyProgress?.choices.prologue_village, "take_bread", "choice recorded");
  assert.equal(out.next.reports[0]?.missionId, "story_prologue_village", "story creates report");
}

{
  const first = resolveStoryChoiceInState({
    state: createTestState(),
    chapterId: "prologue_village",
    choiceId: "take_bread",
    now: new Date("2026-06-30T10:00:00.000Z"),
  });
  const second = resolveStoryChoiceInState({
    state: first.next,
    chapterId: "prologue_village",
    choiceId: "take_bread",
    now: new Date("2026-06-30T10:01:00.000Z"),
  });

  assert.equal(second.result.ok, false, "completed chapter cannot be farmed");
  assert.equal(second.next.soldier.xp, first.next.soldier.xp, "repeat gives no xp");
}

{
  const progress = getInitialStoryProgress();
  assert.equal(progress.arcId, "prologue_castilla");
  assert.equal(progress.currentChapterId, "prologue_village");
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
