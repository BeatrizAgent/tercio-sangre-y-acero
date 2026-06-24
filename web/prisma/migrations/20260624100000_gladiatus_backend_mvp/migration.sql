-- CreateTable
CREATE TABLE "ActiveMission" (
    "id" TEXT NOT NULL,
    "soldierId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completesAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "resultId" TEXT,

    CONSTRAINT "ActiveMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopRotation" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "buyPrice" INTEGER NOT NULL,
    "sellPrice" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL,
    "maxStock" INTEGER NOT NULL,
    "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextRefreshAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopRotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionListing" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "startingBid" INTEGER NOT NULL,
    "currentBid" INTEGER,
    "currentBidderId" TEXT,
    "buyoutPrice" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "endsAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "sellerClaimedAt" TIMESTAMP(3),
    "winnerClaimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuctionListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionBid" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionBid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorldJobRun" (
    "id" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "details" JSONB,

    CONSTRAINT "WorldJobRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActiveMission_soldierId_key" ON "ActiveMission"("soldierId");

-- CreateIndex
CREATE INDEX "ActiveMission_status_completesAt_idx" ON "ActiveMission"("status", "completesAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShopRotation_shopId_itemId_key" ON "ShopRotation"("shopId", "itemId");

-- CreateIndex
CREATE INDEX "ShopRotation_shopId_nextRefreshAt_idx" ON "ShopRotation"("shopId", "nextRefreshAt");

-- CreateIndex
CREATE INDEX "AuctionListing_status_endsAt_idx" ON "AuctionListing"("status", "endsAt");

-- CreateIndex
CREATE INDEX "AuctionListing_sellerId_status_idx" ON "AuctionListing"("sellerId", "status");

-- CreateIndex
CREATE INDEX "AuctionListing_currentBidderId_status_idx" ON "AuctionListing"("currentBidderId", "status");

-- CreateIndex
CREATE INDEX "AuctionBid_listingId_amount_idx" ON "AuctionBid"("listingId", "amount");

-- CreateIndex
CREATE INDEX "AuctionBid_bidderId_createdAt_idx" ON "AuctionBid"("bidderId", "createdAt");

-- CreateIndex
CREATE INDEX "WorldJobRun_job_ranAt_idx" ON "WorldJobRun"("job", "ranAt");

-- AddForeignKey
ALTER TABLE "ActiveMission" ADD CONSTRAINT "ActiveMission_soldierId_fkey" FOREIGN KEY ("soldierId") REFERENCES "Soldier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveMission" ADD CONSTRAINT "ActiveMission_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "MissionDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopRotation" ADD CONSTRAINT "ShopRotation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionListing" ADD CONSTRAINT "AuctionListing_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionBid" ADD CONSTRAINT "AuctionBid_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "AuctionListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
