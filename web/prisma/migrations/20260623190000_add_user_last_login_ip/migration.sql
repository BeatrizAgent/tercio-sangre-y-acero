ALTER TABLE "User" ADD COLUMN "lastLoginIp" TEXT;

CREATE INDEX "User_lastLoginIp_lastLoginAt_idx" ON "User"("lastLoginIp", "lastLoginAt");
