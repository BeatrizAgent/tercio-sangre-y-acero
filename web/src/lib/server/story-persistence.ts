import { normalizeStoryProgress } from "../domain/story";
import type { GameState, MissionResult, StoryProgress } from "../types";

export interface StoryProgressRecord {
  arcId: string;
  currentChapterId: string;
  completedChapterIds: string[];
  choices: Record<string, string>;
}

export interface StoryReportRecord {
  id: string;
  arcId: string;
  chapterId: string;
  choiceId?: string | null;
  report: string;
  rewards: MissionResult["rewards"];
  wounds: string[];
  loot: MissionResult["loot"];
  createdAt: string;
}

export function isStoryMissionId(missionId: string) {
  return missionId.startsWith("story_");
}

function chapterIdFromStoryMissionId(missionId: string) {
  return missionId.replace(/^story_/, "");
}

export function toStoryProgressRecord(progress: StoryProgress | undefined): StoryProgressRecord {
  const normalized = normalizeStoryProgress(progress);
  return {
    arcId: normalized.arcId,
    currentChapterId: normalized.currentChapterId,
    completedChapterIds: [...normalized.completedChapterIds],
    choices: { ...normalized.choices },
  };
}

export function splitReportsForPersistence(
  reports: MissionResult[],
  progress: StoryProgress | undefined,
): { missionReports: MissionResult[]; storyReports: StoryReportRecord[] } {
  const normalizedProgress = toStoryProgressRecord(progress);
  const missionReports: MissionResult[] = [];
  const storyReports: StoryReportRecord[] = [];

  for (const report of reports) {
    if (!isStoryMissionId(report.missionId)) {
      missionReports.push(report);
      continue;
    }

    const chapterId = chapterIdFromStoryMissionId(report.missionId);
    storyReports.push({
      id: report.id,
      arcId: normalizedProgress.arcId,
      chapterId,
      choiceId: normalizedProgress.choices[chapterId] ?? null,
      report: report.report,
      rewards: { ...report.rewards },
      wounds: [...report.wounds],
      loot: report.loot.map((item) => ({ ...item })),
      createdAt: report.createdAt,
    });
  }

  return { missionReports, storyReports };
}

export function storyReportRecordToMissionResult(record: StoryReportRecord): MissionResult {
  return {
    id: record.id,
    missionId: `story_${record.chapterId}`,
    success: true,
    report: record.report,
    rewards: { ...record.rewards },
    fatigue: 0,
    wounds: [...record.wounds],
    loot: record.loot.map((item) => ({ ...item })),
    createdAt: record.createdAt,
  };
}

export function overlayPersistedStoryState(
  snapshot: GameState,
  persisted: { progress?: StoryProgressRecord | null; reports?: StoryReportRecord[] | null },
): GameState {
  const progress = persisted.progress ? toStoryProgressRecord(persisted.progress) : toStoryProgressRecord(snapshot.storyProgress);
  const snapshotMissionReports = snapshot.reports.filter((report) => !isStoryMissionId(report.missionId));
  const storyReports = (persisted.reports ?? []).map(storyReportRecordToMissionResult);

  return {
    ...snapshot,
    storyProgress: progress,
    reports: [...storyReports, ...snapshotMissionReports],
  };
}
