import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInitialState } from "../src/lib/domain/initial-state";
import { persistGameStateForUser } from "../src/lib/actions/_demo";
import { generateRecoveryToken, hashRecoveryToken } from "../src/lib/auth/session";
import { getDb } from "../src/lib/db";

const DEBUG_EMAIL = "codex-debug@tercio.local";
const DEBUG_NAME = "Codex Debug";
const TOKEN_PATH = path.join(process.cwd(), ".demo", "codex-debug-token.txt");
let db: ReturnType<typeof getDb> | null = null;

function loadLocalEnv() {
  try {
    const env = readFileSync(path.join(process.cwd(), ".env"), "utf8");
    for (const line of env.split(/\r?\n/)) {
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // DATABASE_URL may already be supplied by the caller or platform.
  }
}

async function main() {
  loadLocalEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to create the debug user.");
  }

  db = getDb();
  const token = process.env.TERCIO_DEBUG_TOKEN?.trim() || generateRecoveryToken();
  const tokenHash = hashRecoveryToken(token);
  const now = new Date();

  const user = await db.user.upsert({
    where: { email: DEBUG_EMAIL },
    update: {
      name: DEBUG_NAME,
      tokenHash,
      tokenIssuedAt: now,
      lastLoginAt: now,
    },
    create: {
      email: DEBUG_EMAIL,
      name: DEBUG_NAME,
      tokenHash,
      tokenIssuedAt: now,
      lastLoginAt: now,
    },
    include: {
      gameSave: true,
      soldier: { select: { id: true } },
    },
  });

  if (!user.gameSave || !user.soldier) {
    await persistGameStateForUser(user.id, createInitialState(DEBUG_NAME));
  }

  await mkdir(path.dirname(TOKEN_PATH), { recursive: true });
  await writeFile(TOKEN_PATH, `${token}\n`, "utf8");

  console.log(JSON.stringify({ ok: true, email: DEBUG_EMAIL, tokenPath: TOKEN_PATH }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db?.$disconnect();
  });
