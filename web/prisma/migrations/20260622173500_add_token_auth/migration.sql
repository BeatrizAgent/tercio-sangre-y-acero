-- Add token-backed simple auth for browser-game saves.
ALTER TABLE "User" ADD COLUMN "tokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "tokenIssuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

UPDATE "User"
SET "tokenHash" = 'legacy_' || md5("id" || COALESCE("email", '') || "createdAt"::text)
WHERE "tokenHash" IS NULL;

ALTER TABLE "User" ALTER COLUMN "tokenHash" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

CREATE UNIQUE INDEX "User_tokenHash_key" ON "User"("tokenHash");
