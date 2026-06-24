import assert from "node:assert/strict";
import {
  buyRotatingShopItemInState,
  type RotatingShopItem,
} from "../../src/lib/domain/shop-rotation";
import {
  closeAuctionInState,
  listAuctionInState,
  placeAuctionBidInState,
  type AuctionListingState,
} from "../../src/lib/domain/auction";
import { createTestState, withCoins } from "../helpers/state-fixtures";

{
  const stock: RotatingShopItem = {
    itemId: "consumable_vendas_001",
    buyPrice: 10,
    sellPrice: 4,
    stock: 1,
  };
  const state = withCoins(createTestState(), 100);

  const first = buyRotatingShopItemInState(state, stock);
  assert.equal(first.result.ok, true, "first buy succeeds");
  assert.equal(first.stock.stock, 0, "stock decreases");

  const second = buyRotatingShopItemInState(first.next, first.stock);
  assert.equal(second.result.ok, false, "second buy fails with empty stock");
  assert.equal(second.result.message, "El puesto se ha quedado sin existencias.");
  assert.equal(second.stock.stock, 0, "stock never goes negative");
}

{
  const state = withCoins(createTestState(), 100);
  const out = listAuctionInState({
    state,
    itemId: "consumable_vendas_001",
    startingBid: 20,
    buyoutPrice: null,
    now: new Date("2026-06-24T10:00:00.000Z"),
    durationHours: 2,
  });

  assert.equal(out.result.ok, true, "lists owned item");
  assert.equal(out.next.soldier.coins, 99, "2 percent listing fee charged with minimum 1");
  assert.equal(
    out.next.soldier.inventory.find((item) => item.itemId === "consumable_vendas_001")?.quantity,
    1,
    "listed item removed from inventory",
  );
  assert.equal(out.listing.currentBid, null, "new listing has no bid");
}

{
  const listing: AuctionListingState = {
    id: "auction_1",
    sellerId: "seller",
    itemId: "consumable_vendas_001",
    quantity: 1,
    startingBid: 20,
    currentBid: 20,
    currentBidderId: "old_bidder",
    buyoutPrice: null,
    status: "active",
    endsAt: "2026-06-24T12:00:00.000Z",
  };
  const bidder = withCoins(createTestState({ soldier: { id: "new_bidder" } }), 100);
  const oldBidder = withCoins(createTestState({ soldier: { id: "old_bidder" } }), 5);

  const out = placeAuctionBidInState({
    listing,
    bidder,
    previousBidder: oldBidder,
    amount: 25,
    now: new Date("2026-06-24T10:30:00.000Z"),
  });

  assert.equal(out.result.ok, true, "higher bid succeeds");
  assert.equal(out.listing.currentBid, 25, "listing stores new bid");
  assert.equal(out.bidder.soldier.coins, 75, "new bidder pays bid");
  assert.equal(out.previousBidder?.soldier.coins, 25, "previous bidder refunded");
}

{
  const listing: AuctionListingState = {
    id: "auction_1",
    sellerId: "seller",
    itemId: "consumable_vendas_001",
    quantity: 1,
    startingBid: 20,
    currentBid: 25,
    currentBidderId: "buyer",
    buyoutPrice: null,
    status: "active",
    endsAt: "2026-06-24T12:00:00.000Z",
  };
  const seller = withCoins(createTestState({ soldier: { id: "seller" } }), 10);
  const buyer = createTestState({ soldier: { id: "buyer", inventory: [] } });

  const out = closeAuctionInState({
    listing,
    seller,
    winner: buyer,
    now: new Date("2026-06-24T12:01:00.000Z"),
  });

  assert.equal(out.result.ok, true, "expired auction closes");
  assert.equal(out.listing.status, "sold", "listing marked sold");
  assert.equal(out.seller?.soldier.coins, 34, "seller receives bid minus 5 percent fee");
  assert.equal(
    out.winner?.soldier.inventory.find((item) => item.itemId === "consumable_vendas_001")?.quantity,
    1,
    "winner receives item",
  );
}

console.log(JSON.stringify({ ok: true, checked: "backend-economy" }, null, 2));
