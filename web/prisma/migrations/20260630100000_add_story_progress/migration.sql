-- CreateTable
CREATE TABLE "PlayerStoryProgress" (
    "id" TEXT NOT NULL,
    "soldierId" TEXT NOT NULL,
    "arcId" TEXT NOT NULL,
    "currentChapterId" TEXT NOT NULL,
    "completedChapterIds" TEXT[] NOT NULL,
    "choices" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerStoryProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryReport" (
    "id" TEXT NOT NULL,
    "soldierId" TEXT NOT NULL,
    "arcId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "choiceId" TEXT,
    "report" TEXT NOT NULL,
    "rewards" JSONB NOT NULL,
    "wounds" JSONB NOT NULL,
    "loot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryReport_pkey" PRIMARY KEY ("id")
);

-- Backfill durable story progress from existing snapshots.
INSERT INTO "PlayerStoryProgress" (
    "id",
    "soldierId",
    "arcId",
    "currentChapterId",
    "completedChapterIds",
    "choices",
    "createdAt",
    "updatedAt"
)
SELECT
    'story_progress_' || s."id" || '_' || COALESCE(gs."state" #>> '{storyProgress,arcId}', 'prologue_castilla'),
    s."id",
    COALESCE(gs."state" #>> '{storyProgress,arcId}', 'prologue_castilla'),
    COALESCE(gs."state" #>> '{storyProgress,currentChapterId}', 'prologue_village'),
    COALESCE(
        ARRAY(
            SELECT jsonb_array_elements_text(COALESCE(gs."state" #> '{storyProgress,completedChapterIds}', '[]'::jsonb))
        ),
        ARRAY[]::TEXT[]
    ),
    COALESCE(gs."state" #> '{storyProgress,choices}', '{}'::jsonb),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Soldier" s
JOIN "GameSave" gs ON gs."userId" = s."userId"
WHERE gs."state" ? 'storyProgress'
ON CONFLICT DO NOTHING;

-- Backfill story reports from snapshots without using MissionResult FKs.
INSERT INTO "StoryReport" (
    "id",
    "soldierId",
    "arcId",
    "chapterId",
    "choiceId",
    "report",
    "rewards",
    "wounds",
    "loot",
    "createdAt"
)
SELECT
    report_row.report ->> 'id',
    s."id",
    COALESCE(gs."state" #>> '{storyProgress,arcId}', 'prologue_castilla'),
    regexp_replace(report_row.report ->> 'missionId', '^story_', ''),
    (gs."state" #> '{storyProgress,choices}') ->> regexp_replace(report_row.report ->> 'missionId', '^story_', ''),
    report_row.report ->> 'report',
    COALESCE(report_row.report -> 'rewards', '{}'::jsonb),
    COALESCE(report_row.report -> 'wounds', '[]'::jsonb),
    COALESCE(report_row.report -> 'loot', '[]'::jsonb),
    COALESCE((report_row.report ->> 'createdAt')::TIMESTAMP(3), CURRENT_TIMESTAMP)
FROM "Soldier" s
JOIN "GameSave" gs ON gs."userId" = s."userId"
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(gs."state" -> 'reports', '[]'::jsonb)) AS report_row(report)
WHERE report_row.report ->> 'missionId' LIKE 'story_%'
  AND report_row.report ? 'id'
ON CONFLICT DO NOTHING;

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStoryProgress_soldierId_arcId_key" ON "PlayerStoryProgress"("soldierId", "arcId");

-- CreateIndex
CREATE INDEX "PlayerStoryProgress_arcId_currentChapterId_idx" ON "PlayerStoryProgress"("arcId", "currentChapterId");

-- CreateIndex
CREATE INDEX "StoryReport_soldierId_createdAt_idx" ON "StoryReport"("soldierId", "createdAt");

-- CreateIndex
CREATE INDEX "StoryReport_soldierId_arcId_idx" ON "StoryReport"("soldierId", "arcId");

-- AddForeignKey
ALTER TABLE "PlayerStoryProgress" ADD CONSTRAINT "PlayerStoryProgress_soldierId_fkey" FOREIGN KEY ("soldierId") REFERENCES "Soldier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryReport" ADD CONSTRAINT "StoryReport_soldierId_fkey" FOREIGN KEY ("soldierId") REFERENCES "Soldier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
