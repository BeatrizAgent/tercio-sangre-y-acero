-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Soldier" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "coins" INTEGER NOT NULL,
    "honor" INTEGER NOT NULL,
    "xp" INTEGER NOT NULL,
    "fatigue" INTEGER NOT NULL,
    "unpaidWages" INTEGER NOT NULL,
    "reputation" INTEGER NOT NULL,
    "corruption" INTEGER NOT NULL DEFAULT 0,
    "banMissionsLeft" INTEGER NOT NULL DEFAULT 0,
    "saveState" JSONB,

    CONSTRAINT "Soldier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSave" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameSave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoldierStats" (
    "id" TEXT NOT NULL,
    "soldierId" TEXT NOT NULL,
    "pike" INTEGER NOT NULL,
    "sword" INTEGER NOT NULL,
    "arquebus" INTEGER NOT NULL,
    "discipline" INTEGER NOT NULL,
    "vigor" INTEGER NOT NULL,
    "cunning" INTEGER NOT NULL,
    "command" INTEGER NOT NULL,

    CONSTRAINT "SoldierStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "footprint" JSONB NOT NULL,
    "value" INTEGER NOT NULL,
    "effects" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "rarity" TEXT,
    "tier" INTEGER,
    "passives" JSONB,
    "requirements" JSONB,
    "assetId" TEXT,

    CONSTRAINT "ItemDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "soldierId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "soldierId" TEXT NOT NULL,
    "head" TEXT,
    "body" TEXT,
    "mainHand" TEXT,
    "offHand" TEXT,
    "firearm" TEXT,
    "accessory" TEXT,
    "boots" TEXT,
    "consumable" TEXT,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionDefinition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "enemyId" TEXT NOT NULL,
    "sceneAssetId" TEXT,
    "rewards" JSONB NOT NULL,
    "fatigue" INTEGER NOT NULL,
    "woundChance" INTEGER NOT NULL,
    "woundId" TEXT,
    "lootTableId" TEXT,
    "reportTags" TEXT[],
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "locationType" TEXT NOT NULL,
    "region" TEXT,

    CONSTRAINT "MissionDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionResult" (
    "id" TEXT NOT NULL,
    "soldierId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "report" TEXT NOT NULL,
    "rewards" JSONB NOT NULL,
    "wounds" JSONB NOT NULL,
    "loot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WoundDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "effects" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "treatmentItems" JSONB NOT NULL,

    CONSTRAINT "WoundDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveWound" (
    "id" TEXT NOT NULL,
    "soldierId" TEXT NOT NULL,
    "woundId" TEXT NOT NULL,
    "treated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ActiveWound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopItem" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL DEFAULT 'company_armory',
    "itemId" TEXT NOT NULL,
    "buyPrice" INTEGER NOT NULL,
    "sellPrice" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL,

    CONSTRAINT "ShopItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingLog" (
    "id" TEXT NOT NULL,
    "soldierId" TEXT NOT NULL,
    "stat" TEXT NOT NULL,
    "cost" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LootTable" (
    "id" TEXT NOT NULL,
    "drops" JSONB NOT NULL,

    CONSTRAINT "LootTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportFragment" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tags" TEXT[],
    "text" TEXT NOT NULL,

    CONSTRAINT "ReportFragment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetDefinition" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL,
    "transparent" BOOLEAN NOT NULL,
    "usage" JSONB NOT NULL,
    "mature" BOOLEAN NOT NULL,
    "presentation" TEXT NOT NULL,

    CONSTRAINT "AssetDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnemyDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "power" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "portraitAssetId" TEXT,

    CONSTRAINT "EnemyDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minXp" INTEGER NOT NULL,
    "minHonor" INTEGER NOT NULL,

    CONSTRAINT "RankDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameEventDefinition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "assetId" TEXT,
    "mature" BOOLEAN NOT NULL DEFAULT false,
    "presentation" TEXT,
    "choices" JSONB NOT NULL,

    CONSTRAINT "GameEventDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "portraitAssetId" TEXT NOT NULL,
    "tercioAssetId" TEXT,
    "emotionAssetId" TEXT,
    "spriteSetId" TEXT,
    "formationSlot" TEXT NOT NULL,
    "fatigue" INTEGER NOT NULL,
    "stats" JSONB NOT NULL,
    "equipment" JSONB NOT NULL,

    CONSTRAINT "CharacterDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpriteSetDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frames" JSONB NOT NULL,

    CONSTRAINT "SpriteSetDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentCandidateDefinition" (
    "id" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "cost" JSONB NOT NULL,
    "character" JSONB NOT NULL,

    CONSTRAINT "RecruitmentCandidateDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingDefinition" (
    "stat" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cost" JSONB NOT NULL,
    "gain" INTEGER NOT NULL,
    "fatigue" INTEGER NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "TrainingDefinition_pkey" PRIMARY KEY ("stat")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Soldier_userId_key" ON "Soldier"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GameSave_userId_key" ON "GameSave"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SoldierStats_soldierId_key" ON "SoldierStats"("soldierId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_soldierId_itemId_key" ON "InventoryItem"("soldierId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_soldierId_key" ON "Equipment"("soldierId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopItem_shopId_itemId_key" ON "ShopItem"("shopId", "itemId");

-- AddForeignKey
ALTER TABLE "Soldier" ADD CONSTRAINT "Soldier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSave" ADD CONSTRAINT "GameSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoldierStats" ADD CONSTRAINT "SoldierStats_soldierId_fkey" FOREIGN KEY ("soldierId") REFERENCES "Soldier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_soldierId_fkey" FOREIGN KEY ("soldierId") REFERENCES "Soldier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_soldierId_fkey" FOREIGN KEY ("soldierId") REFERENCES "Soldier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionResult" ADD CONSTRAINT "MissionResult_soldierId_fkey" FOREIGN KEY ("soldierId") REFERENCES "Soldier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionResult" ADD CONSTRAINT "MissionResult_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "MissionDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveWound" ADD CONSTRAINT "ActiveWound_soldierId_fkey" FOREIGN KEY ("soldierId") REFERENCES "Soldier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveWound" ADD CONSTRAINT "ActiveWound_woundId_fkey" FOREIGN KEY ("woundId") REFERENCES "WoundDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopItem" ADD CONSTRAINT "ShopItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingLog" ADD CONSTRAINT "TrainingLog_soldierId_fkey" FOREIGN KEY ("soldierId") REFERENCES "Soldier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
