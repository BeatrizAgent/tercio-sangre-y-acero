import { jsonResponse, optionsResponse } from "@/lib/api/cors";
import { UnauthorizedError } from "@/lib/auth/session";
import { auctionErrorResult, listAuctionViewsForCurrentSession } from "@/lib/server/market-auctions";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  try {
    const result = await listAuctionViewsForCurrentSession();
    return jsonResponse(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonResponse(auctionErrorResult(error), { status: 401 });
    }
    return jsonResponse(auctionErrorResult(error), { status: 500 });
  }
}
