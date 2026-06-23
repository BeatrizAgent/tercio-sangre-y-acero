ALTER TABLE "User" ADD COLUMN "isBot" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ArenaBotProfile" (
    "id" TEXT NOT NULL,
    "soldierId" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "seedOffset" INTEGER NOT NULL,
    "lastProgressedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArenaBotProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ArenaBotProfile_soldierId_key" ON "ArenaBotProfile"("soldierId");
CREATE INDEX "ArenaBotProfile_active_seedOffset_idx" ON "ArenaBotProfile"("active", "seedOffset");

ALTER TABLE "ArenaBotProfile" ADD CONSTRAINT "ArenaBotProfile_soldierId_fkey" FOREIGN KEY ("soldierId") REFERENCES "Soldier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
