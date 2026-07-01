import assert from "node:assert/strict";
import {
  overlayPersistedStoryState,
  splitReportsForPersistence,
  toStoryProgressRecord,
} from "../../src/lib/server/story-persistence";
import { createTestState } from "../helpers/state-fixtures";

const storyReport = {
  id: "story_cap1_choza_castellana_1782813600000",
  missionId: "story_cap1_choza_castellana",
  success: true,
  report: "**[Historia: Casa de tierra y humo]**",
  rewards: { coins: 0, xp: 5, honor: 1 },
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
  chapterId: "cap1_choza_castellana",
  choiceId: "shield_brother",
  report: storyReport.report,
  rewards: storyReport.rewards,
  wounds: storyReport.wounds,
  loot: storyReport.loot,
  createdAt: storyReport.createdAt,
};

{
  const progress = {
    arcId: "prologue_castilla",
    currentChapterId: "cap1_recuerdo_madre",
    completedChapterIds: ["cap1_choza_castellana"],
    choices: { cap1_choza_castellana: "shield_brother" },
  };

  const split = splitReportsForPersistence([storyReport, missionReport], progress);

  assert.deepEqual(split.missionReports, [missionReport], "story reports do not persist through MissionResult");
  assert.equal(split.storyReports.length, 1, "story report gets normalized separately");
  assert.equal(split.storyReports[0]?.chapterId, "cap1_choza_castellana");
  assert.equal(split.storyReports[0]?.choiceId, "shield_brother");
}

{
  const record = toStoryProgressRecord({
    arcId: "prologue_castilla",
    currentChapterId: "missing_chapter",
    completedChapterIds: ["cap1_choza_castellana", "missing_chapter"],
    choices: { cap1_choza_castellana: "shield_brother" },
  });

  assert.equal(record.currentChapterId, "cap1_choza_castellana", "invalid current chapter normalizes to start");
  assert.deepEqual(record.completedChapterIds, ["cap1_choza_castellana"], "invalid completed chapters are pruned");
  assert.deepEqual(record.choices, { cap1_choza_castellana: "shield_brother" });
}

{
  const snapshot = createTestState({
    reports: [missionReport],
    storyProgress: {
      arcId: "prologue_castilla",
      currentChapterId: "cap1_choza_castellana",
      completedChapterIds: [],
      choices: {},
    },
  });
  const state = overlayPersistedStoryState(snapshot, {
    progress: {
      arcId: "prologue_castilla",
      currentChapterId: "cap1_recuerdo_madre",
      completedChapterIds: ["cap1_choza_castellana"],
      choices: { cap1_choza_castellana: "shield_brother" },
    },
    reports: [persistedStoryReport],
  });

  assert.equal(state.storyProgress?.currentChapterId, "cap1_recuerdo_madre", "DB progress wins over stale snapshot");
  assert.deepEqual(
    state.reports.map((report) => report.id),
    [storyReport.id, missionReport.id],
    "DB story reports merge with non-story snapshot reports",
  );
}

console.log(JSON.stringify({ ok: true, checked: "story-persistence" }, null, 2));
