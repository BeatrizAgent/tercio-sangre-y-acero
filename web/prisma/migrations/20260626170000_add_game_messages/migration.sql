CREATE TABLE "GameMessage" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB,
    "auctionListingId" TEXT,
    "readAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GameMessage_recipientId_kind_auctionListingId_key" ON "GameMessage"("recipientId", "kind", "auctionListingId");
CREATE INDEX "GameMessage_recipientId_createdAt_idx" ON "GameMessage"("recipientId", "createdAt");
CREATE INDEX "GameMessage_auctionListingId_idx" ON "GameMessage"("auctionListingId");

ALTER TABLE "GameMessage" ADD CONSTRAINT "GameMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Soldier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
