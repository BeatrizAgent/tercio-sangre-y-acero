import { jsonResponse, optionsResponse } from "@/lib/api/cors";
import { UnauthorizedError } from "@/lib/auth/session";
import { bidErrorResult, placeAuctionBidForCurrentSession } from "@/lib/server/market-bids";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { listingId?: unknown; amount?: unknown };
    const result = await placeAuctionBidForCurrentSession({
      listingId: typeof body.listingId === "string" ? body.listingId : "",
      amount: typeof body.amount === "number" ? body.amount : Number.NaN,
    });
    return jsonResponse(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonResponse(bidErrorResult(error), { status: 401 });
    }
    return jsonResponse(bidErrorResult(error), { status: 500 });
  }
}
