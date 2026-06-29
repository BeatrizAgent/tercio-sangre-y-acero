// auction-bulk.test.ts — exhaustive edge-case coverage for the auction
// domain (list / bid / close). The existing backend-economy.test.ts covers
// the happy path; this file fills in the failure modes.

import assert from "node:assert/strict";
import {
  closeAuctionInState,
  listAuctionInState,
  placeAuctionBidInState,
  type AuctionListingState,
} from "../../src/lib/domain/auction";
import { createTestState, withCoins } from "../helpers/state-fixtures";

const ownedItem = "consumable_vendas_001";

{
  // bid on a cancelled listing -> rejected.
  const listing: AuctionListingState = {
    id: "a1",
    sellerId: "s1",
    itemId: ownedItem,
    quantity: 1,
    startingBid: 10,
    currentBid: null,
    currentBidderId: null,
    buyoutPrice: null,
    status: "cancelled",
    endsAt: new Date("2026-06-24T12:00:00.000Z").toISOString(),
  };
  const bidder = withCoins(createTestState({ soldier: { id: "b1" } }), 100);
  const out = placeAuctionBidInState({
    listing,
    bidder,
    previousBidder: null,
    amount: 20,
    now: new Date("2026-06-24T10:00:00.000Z"),
  });
  assert.equal(out.result.ok, false);
  assert.match(out.result.message, /no esta activa/);
}

{
  // bid on an already-closed listing -> rejected.
  const listing: AuctionListingState = {
    id: "a1",
    sellerId: "s1",
    itemId: ownedItem,
    quantity: 1,
    startingBid: 10,
    currentBid: 20,
    currentBidderId: "other",
    buyoutPrice: null,
    status: "sold",
    endsAt: new Date("2026-06-24T12:00:00.000Z").toISOString(),
  };
  const bidder = withCoins(createTestState({ soldier: { id: "b2" } }), 100);
  const out = placeAuctionBidInState({
    listing,
    bidder,
    previousBidder: null,
    amount: 30,
    now: new Date("2026-06-24T10:00:00.000Z"),
  });
  assert.equal(out.result.ok, false);
  assert.match(out.result.message, /no esta activa/);
}

{
  // bid on an expired listing -> rejected.
  const listing: AuctionListingState = {
    id: "a1",
    sellerId: "s1",
    itemId: ownedItem,
    quantity: 1,
    startingBid: 10,
    currentBid: null,
    currentBidderId: null,
    buyoutPrice: null,
    status: "active",
    endsAt: new Date("2026-06-24T10:00:00.000Z").toISOString(),
  };
  const bidder = withCoins(createTestState({ soldier: { id: "b3" } }), 100);
  const out = placeAuctionBidInState({
    listing,
    bidder,
    previousBidder: null,
    amount: 20,
    now: new Date("2026-06-24T11:00:00.000Z"),
  });
  assert.equal(out.result.ok, false);
  assert.match(out.result.message, /ha terminado/);
}

{
  // bid on your own listing -> rejected.
  const listing: AuctionListingState = {
    id: "a1",
    sellerId: "me",
    itemId: ownedItem,
    quantity: 1,
    startingBid: 10,
    currentBid: null,
    currentBidderId: null,
    buyoutPrice: null,
    status: "active",
    endsAt: new Date("2026-06-24T12:00:00.000Z").toISOString(),
  };
  const bidder = withCoins(createTestState({ soldier: { id: "me" } }), 100);
  const out = placeAuctionBidInState({
    listing,
    bidder,
    previousBidder: null,
    amount: 20,
    now: new Date("2026-06-24T10:00:00.000Z"),
  });
  assert.equal(out.result.ok, false);
  assert.match(out.result.message, /propio lote/);
}

{
  // bid below minimum (currentBid or startingBid - 1) -> rejected.
  const listing: AuctionListingState = {
    id: "a1",
    sellerId: "s1",
    itemId: ownedItem,
    quantity: 1,
    startingBid: 10,
    currentBid: 25,
    currentBidderId: "other",
    buyoutPrice: null,
    status: "active",
    endsAt: new Date("2026-06-24T12:00:00.000Z").toISOString(),
  };
  const bidder = withCoins(createTestState({ soldier: { id: "b4" } }), 100);
  const out = placeAuctionBidInState({
    listing,
    bidder,
    previousBidder: null,
    amount: 20,
    now: new Date("2026-06-24T10:30:00.000Z"),
  });
  assert.equal(out.result.ok, false);
  assert.match(out.result.message, /m.nima es 26/);
}

{
  // bid amount that meets or exceeds buyout -> listing becomes "sold".
  const listing: AuctionListingState = {
    id: "a1",
    sellerId: "s1",
    itemId: ownedItem,
    quantity: 1,
    startingBid: 10,
    currentBid: null,
    currentBidderId: null,
    buyoutPrice: 50,
    status: "active",
    endsAt: new Date("2026-06-24T12:00:00.000Z").toISOString(),
  };
  const bidder = withCoins(createTestState({ soldier: { id: "b5" } }), 100);
  const out = placeAuctionBidInState({
    listing,
    bidder,
    previousBidder: null,
    amount: 60,
    now: new Date("2026-06-24T10:30:00.000Z"),
  });
  assert.equal(out.result.ok, true);
  assert.equal(out.listing.status, "sold");
  assert.equal(out.listing.currentBid, 60);
  assert.equal(out.listing.currentBidderId, "b5");
}

{
  // bid without enough coins -> rejected.
  const listing: AuctionListingState = {
    id: "a1",
    sellerId: "s1",
    itemId: ownedItem,
    quantity: 1,
    startingBid: 10,
    currentBid: null,
    currentBidderId: null,
    buyoutPrice: null,
    status: "active",
    endsAt: new Date("2026-06-24T12:00:00.000Z").toISOString(),
  };
  const bidder = withCoins(createTestState({ soldier: { id: "b6" } }), 5);
  const out = placeAuctionBidInState({
    listing,
    bidder,
    previousBidder: null,
    amount: 20,
    now: new Date("2026-06-24T10:30:00.000Z"),
  });
  assert.equal(out.result.ok, false);
  assert.match(out.result.message, /Doblones/);
}

// listAuctionInState edges ---------------------------------------------

{
  // startingBid = 0 -> rejected.
  const state = withCoins(createTestState(), 100);
  const out = listAuctionInState({
    state,
    itemId: ownedItem,
    startingBid: 0,
    buyoutPrice: null,
    now: new Date("2026-06-24T10:00:00.000Z"),
    durationHours: 2,
  });
  assert.equal(out.result.ok, false);
  assert.match(out.result.message, /positiva/);
}

{
  // insufficient coins for the listing fee (2% rounded down to <1 floor).
  const state = withCoins(createTestState(), 0);
  const out = listAuctionInState({
    state,
    itemId: ownedItem,
    startingBid: 1,
    buyoutPrice: null,
    now: new Date("2026-06-24T10:00:00.000Z"),
    durationHours: 2,
  });
  assert.equal(out.result.ok, false);
  assert.match(out.result.message, /tasa de subasta/);
}

{
  // item not owned -> rejected.
  const state = withCoins(createTestState(), 100);
  const out = listAuctionInState({
    state,
    itemId: "weapon_pica_ash_001",
    startingBid: 5,
    buyoutPrice: null,
    now: new Date("2026-06-24T10:00:00.000Z"),
    durationHours: 2,
  });
  assert.equal(out.result.ok, false);
  assert.match(out.result.message, /No posees/);
}

{
  // happy path: 8h and 24h duration both end the listing in the future.
  const state = withCoins(createTestState(), 100);
  const now = new Date("2026-06-24T10:00:00.000Z");
  for (const durationHours of [2, 8, 24] as const) {
    const out = listAuctionInState({
      state,
      itemId: ownedItem,
      startingBid: 20,
      buyoutPrice: 100,
      now,
      durationHours,
    });
    assert.equal(out.result.ok, true, `durationHours=${durationHours}`);
    const endsAt = new Date(out.listing.endsAt);
    const expected = now.getTime() + durationHours * 60 * 60_000;
    assert.equal(endsAt.getTime(), expected, `endsAt for ${durationHours}h`);
  }
}

// closeAuctionInState edges --------------------------------------------

{
  // already closed -> no-op reject.
  const listing: AuctionListingState = {
    id: "a1",
    sellerId: "s1",
    itemId: ownedItem,
    quantity: 1,
    startingBid: 10,
    currentBid: 20,
    currentBidderId: "w1",
    buyoutPrice: null,
    status: "sold",
    endsAt: new Date("2026-06-24T10:00:00.000Z").toISOString(),
  };
  const out = closeAuctionInState({
    listing,
    seller: withCoins(createTestState({ soldier: { id: "s1" } }), 0),
    winner: createTestState({ soldier: { id: "w1" } }),
    now: new Date("2026-06-24T11:00:00.000Z"),
  });
  assert.equal(out.result.ok, false);
  assert.match(out.result.message, /ya esta cerrada/);
}

{
  // closing before endsAt -> rejected.
  const listing: AuctionListingState = {
    id: "a1",
    sellerId: "s1",
    itemId: ownedItem,
    quantity: 1,
    startingBid: 10,
    currentBid: null,
    currentBidderId: null,
    buyoutPrice: null,
    status: "active",
    endsAt: new Date("2026-06-24T12:00:00.000Z").toISOString(),
  };
  const out = closeAuctionInState({
    listing,
    seller: withCoins(createTestState({ soldier: { id: "s1" } }), 0),
    winner: null,
    now: new Date("2026-06-24T10:00:00.000Z"),
  });
  assert.equal(out.result.ok, false);
  assert.match(out.result.message, /aun no ha terminado/);
}

{
  // expired with no bids -> seller gets the item back, listing = expired.
  const listing: AuctionListingState = {
    id: "a1",
    sellerId: "s1",
    itemId: ownedItem,
    quantity: 1,
    startingBid: 10,
    currentBid: null,
    currentBidderId: null,
    buyoutPrice: null,
    status: "active",
    endsAt: new Date("2026-06-24T10:00:00.000Z").toISOString(),
  };
  const seller = withCoins(createTestState({ soldier: { id: "s1" } }), 0);
  const out = closeAuctionInState({
    listing,
    seller,
    winner: null,
    now: new Date("2026-06-24T11:00:00.000Z"),
  });
  assert.equal(out.result.ok, true);
  assert.equal(out.listing.status, "expired");
  // The seller is returned with the item in their inventory.
  assert.ok(
    out.seller?.soldier.inventory.some((item) => item.itemId === ownedItem && item.quantity >= 1),
  );
}

console.log(JSON.stringify({ ok: true, checked: "auction-bulk" }, null, 2));
