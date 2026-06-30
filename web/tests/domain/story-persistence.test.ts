import assert from "node:assert/strict";
import {
  overlayPersistedStoryState,
  splitReportsForPersistence,
  toStoryProgressRecord,
} from "../../src/lib/server/story-persistence";
import { createTestState } from "../helpers/state-fixtures";

const storyReport = {
  id: "story_prologue_village_1782813600000",
  missionId: "story_prologue_village",
  success: true,
  report: "**[Historia: Salida de la aldea]**",
  rewards: { coins: 2, xp: 6, honor: 1 },
  fatigue: 0,
  wounds: [],
  loot: [{ itemId: "consumable_pan_duro_001", quantity: 1 }],
  createdAt: "2026-06-30T10:00:00.000Z",
};

const missionReport = {
  id: "mission_1",
  missionId: "patrol_muddy_road",
  success: true,
  report: "Patrulla completada.",
  rewards: { coins: 4, xp: 3, honor: 0 },
  fatigue: 2,
  wounds: [],
  loot: [],
  createdAt: "2026-06-30T11:00:00.000Z",
};

const persistedStoryReport = {
  id: storyReport.id,
  arcId: "prologue_castilla",
  chapterId: "prologue_village",
  choiceId: "take_bread",
  report: storyReport.report,
  rewards: storyReport.rewards,
  wounds: storyReport.wounds,
  loot: storyReport.loot,
  createdAt: storyReport.createdAt,
};

{
  const progress = {
    arcId: "prologue_castilla",
    currentChapterId: "prologue_recruiter",
    completedChapterIds: ["prologue_village"],
    choices: { prologue_village: "take_bread" },
  };

  const split = splitReportsForPersistence([storyReport, missionReport], progress);

  assert.deepEqual(split.missionReports, [missionReport], "story reports do not persist through MissionResult");
  assert.equal(split.storyReports.length, 1, "story report gets normalized separately");
  assert.equal(split.storyReports[0]?.chapterId, "prologue_village");
  assert.equal(split.storyReports[0]?.choiceId, "take_bread");
}

{
  const record = toStoryProgressRecord({
    arcId: "prologue_castilla",
    currentChapterId: "missing_chapter",
    completedChapterIds: ["prologue_village", "missing_chapter"],
    choices: { prologue_village: "take_bread" },
  });

  assert.equal(record.currentChapterId, "prologue_village", "invalid current chapter normalizes to start");
  assert.deepEqual(record.completedChapterIds, ["prologue_village"], "invalid completed chapters are pruned");
  assert.deepEqual(record.choices, { prologue_village: "take_bread" });
}

{
  const snapshot = createTestState({
    reports: [missionReport],
    storyProgress: {
      arcId: "prologue_castilla",
      currentChapterId: "prologue_village",
      completedChapterIds: [],
      choices: {},
    },
  });
  const state = overlayPersistedStoryState(snapshot, {
    progress: {
      arcId: "prologue_castilla",
      currentChapterId: "prologue_recruiter",
      completedChapterIds: ["prologue_village"],
      choices: { prologue_village: "take_bread" },
    },
    reports: [persistedStoryReport],
  });

  assert.equal(state.storyProgress?.currentChapterId, "prologue_recruiter", "DB progress wins over stale snapshot");
  assert.deepEqual(
    state.reports.map((report) => report.id),
    [storyReport.id, missionReport.id],
    "DB story reports merge with non-story snapshot reports",
  );
}

console.log(JSON.stringify({ ok: true, checked: "story-persistence" }, null, 2));
