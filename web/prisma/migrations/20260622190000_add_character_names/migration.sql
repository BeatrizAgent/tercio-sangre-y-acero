CREATE TABLE "CharacterName" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterName_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterName_kind_normalized_key" ON "CharacterName"("kind", "normalized");
CREATE INDEX "CharacterName_kind_sortOrder_idx" ON "CharacterName"("kind", "sortOrder");
