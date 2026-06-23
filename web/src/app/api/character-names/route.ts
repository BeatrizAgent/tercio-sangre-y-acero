import { readFile } from "node:fs/promises";
import path from "node:path";
import { jsonResponse, optionsResponse } from "@/lib/api/cors";
import { getDb } from "@/lib/db";

interface CharacterNamesFile {
  version: number;
  locale: string;
  era: string;
  region: string;
  description: string;
  firstNames: string[];
  surnames: string[];
}

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, s-maxage=300",
};

export async function OPTIONS() {
  return optionsResponse();
}

async function readStaticNames() {
  const filePath = path.join(process.cwd(), "data", "json", "character-names.json");
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as CharacterNamesFile;
}

async function readDbNames() {
  const [staticData, rows] = await Promise.all([
    readStaticNames(),
    getDb().characterName.findMany({
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  const firstNames = rows.filter((row) => row.kind === "first").map((row) => row.value);
  const surnames = rows.filter((row) => row.kind === "surname").map((row) => row.value);

  if (firstNames.length === 0 || surnames.length === 0) {
    throw new Error("character-names DB catalog is empty");
  }

  return { ...staticData, firstNames, surnames };
}

export async function GET() {
  const canUseDb = Boolean(process.env.DATABASE_URL) && process.env.TERCIO_DEMO_STORE !== "filesystem";

  try {
    const data = canUseDb ? await readDbNames() : await readStaticNames();
    return jsonResponse(data, { headers: CACHE_HEADERS });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      try {
        const data = await readStaticNames();
        return jsonResponse(data, { headers: CACHE_HEADERS });
      } catch {
        // Return original DB/file error below.
      }
    }

    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: CACHE_HEADERS },
    );
  }
}
