import { getCatalogCounts } from "@/lib/api/catalog";
import { jsonResponse, optionsResponse } from "@/lib/api/cors";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  try {
    const catalog = await getCatalogCounts();
    return jsonResponse({ ok: true, catalog });
  } catch (error) {
    return jsonResponse(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
