import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const schemaPath = path.join(root, "prisma/schema.prisma");
const seedPath = path.join(root, "prisma/seed.ts");

const schema = fs.readFileSync(schemaPath, "utf8");
const seed = fs.readFileSync(seedPath, "utf8");

const failures = [];

const requiredModels = [
  "AssetDefinition",
  "EnemyDefinition",
  "RankDefinition",
  "GameEventDefinition",
  "CharacterDefinition",
  "RecruitmentCandidateDefinition",
  "TrainingDefinition",
];

for (const model of requiredModels) {
  if (!schema.includes(`model ${model}`)) failures.push(`schema missing model ${model}`);
}

const requiredSchemaTokens = [
  "footprint    Json",
  "rarity       String?",
  "tier         Int?",
  "passives     Json?",
  "requirements Json?",
  "assetId      String?",
  "sceneAssetId String?",
  "x            Int",
  "y            Int",
  "locationType String",
  "region       String?",
  "treatmentItems Json",
  "@@unique([shopId, itemId])",
];

for (const token of requiredSchemaTokens) {
  if (!schema.includes(token)) failures.push(`schema missing token ${token}`);
}

const requiredSeedTokens = [
  "assetDefinitions",
  "enemies",
  "ranks",
  "events",
  "characterDefinitions",
  "recruitmentCandidates",
  "training",
  "deleteMany",
  "upsert",
];

for (const token of requiredSeedTokens) {
  if (!seed.includes(token)) failures.push(`seed missing token ${token}`);
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: requiredModels.length + requiredSchemaTokens.length }, null, 2));
