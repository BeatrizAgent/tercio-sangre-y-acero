import { addInventoryItem, BACKPACK_CHESTS, BACKPACK_COLS, BACKPACK_ROWS } from "./inventory-grid";
import { fail, ok, type ActionResult } from "./result";
import type { GameState } from "../types";

export type AuctionStatus = "active" | "sold" | "expired" | "cancelled";

export interface AuctionListingState {
  id: string;
  sellerId: string;
  itemId: string;
  quantity: number;
  startingBid: number;
  currentBid: number | null;
  currentBidderId: string | null;
  buyoutPrice: number | null;
  status: AuctionStatus;
  endsAt: string;
}

function fee(amount: number, pct: number) {
  return Math.max(1, Math.floor(amount * pct));
}

export function listAuctionInState({
  state,
  itemId,
  startingBid,
  buyoutPrice,
  now,
  durationHours,
}: {
  state: GameState;
  itemId: string;
  startingBid: number;
  buyoutPrice: number | null;
  now: Date;
  durationHours: 2 | 8 | 24;
}): { next: GameState; listing: AuctionListingState; result: ActionResult<{ listing: AuctionListingState }> } {
  const owned = state.soldier.inventory.find((item) => item.itemId === itemId);
  if (!owned || owned.quantity < 1) {
    return {
      next: state,
      listing: emptyListing(state.soldier.id, itemId, now),
      result: fail("No posees este objeto."),
    };
  }
  if (startingBid < 1) {
    return {
      next: state,
      listing: emptyListing(state.soldier.id, itemId, now),
      result: fail("La puja inicial debe ser positiva."),
    };
  }

  const listingFee = fee(startingBid, 0.02);
  if (state.soldier.coins < listingFee) {
    return {
      next: state,
      listing: emptyListing(state.soldier.id, itemId, now),
      result: fail("No tienes doblones para pagar la tasa de subasta."),
    };
  }

  const inventory = state.soldier.inventory
    .map((item) => (item.itemId === itemId ? { ...item, quantity: item.quantity - 1 } : item))
    .filter((item) => item.quantity > 0);
  const listing: AuctionListingState = {
    id: `auction_${state.soldier.id}_${now.getTime()}`,
    sellerId: state.soldier.id,
    itemId,
    quantity: 1,
    startingBid,
    currentBid: null,
    currentBidderId: null,
    buyoutPrice,
    status: "active",
    endsAt: new Date(now.getTime() + durationHours * 60 * 60_000).toISOString(),
  };

  return {
    next: {
      ...state,
      soldier: { ...state.soldier, coins: state.soldier.coins - listingFee, inventory },
    },
    listing,
    result: ok("Lote puesto en subasta.", { listing }),
  };
}

export function placeAuctionBidInState({
  listing,
  bidder,
  previousBidder,
  amount,
  now,
}: {
  listing: AuctionListingState;
  bidder: GameState;
  previousBidder: GameState | null;
  amount: number;
  now: Date;
}): {
  listing: AuctionListingState;
  bidder: GameState;
  previousBidder: GameState | null;
  result: ActionResult<{ listing: AuctionListingState }>;
} {
  if (listing.status !== "active") return { listing, bidder, previousBidder, result: fail("La subasta no esta activa.") };
  if (new Date(listing.endsAt).getTime() <= now.getTime()) {
    return { listing, bidder, previousBidder, result: fail("La subasta ya ha terminado.") };
  }
  if (bidder.soldier.id === listing.sellerId) {
    return { listing, bidder, previousBidder, result: fail("No puedes pujar por tu propio lote.") };
  }
  const minimum = (listing.currentBid ?? listing.startingBid - 1) + 1;
  if (amount < minimum) {
    return { listing, bidder, previousBidder, result: fail(`La puja minima es ${minimum}.`) };
  }
  if (bidder.soldier.coins < amount) {
    return { listing, bidder, previousBidder, result: fail("Doblones insuficientes.") };
  }

  const refundedPreviousBidder = previousBidder && listing.currentBid
    ? {
        ...previousBidder,
        soldier: { ...previousBidder.soldier, coins: previousBidder.soldier.coins + listing.currentBid },
      }
    : previousBidder;
  const nextBidder = {
    ...bidder,
    soldier: { ...bidder.soldier, coins: bidder.soldier.coins - amount },
  };
  const nextListing: AuctionListingState = {
    ...listing,
    currentBid: amount,
    currentBidderId: bidder.soldier.id,
    status: listing.buyoutPrice !== null && amount >= listing.buyoutPrice ? "sold" : "active",
  };

  return {
    listing: nextListing,
    bidder: nextBidder,
    previousBidder: refundedPreviousBidder,
    result: ok("Puja registrada.", { listing: nextListing }),
  };
}

export function closeAuctionInState({
  listing,
  seller,
  winner,
  now,
}: {
  listing: AuctionListingState;
  seller: GameState | null;
  winner: GameState | null;
  now: Date;
}): {
  listing: AuctionListingState;
  seller: GameState | null;
  winner: GameState | null;
  result: ActionResult;
} {
  if (listing.status !== "active") return { listing, seller, winner, result: fail("La subasta ya esta cerrada.") };
  if (new Date(listing.endsAt).getTime() > now.getTime()) {
    return { listing, seller, winner, result: fail("La subasta aun no ha terminado.") };
  }
  if (!listing.currentBid || !listing.currentBidderId) {
    const returned = seller
      ? addItemToState(seller, listing.itemId, listing.quantity)
      : seller;
    return {
      listing: { ...listing, status: "expired" },
      seller: returned,
      winner,
      result: ok("Subasta cerrada sin comprador."),
    };
  }

  const sellerRevenue = listing.currentBid - fee(listing.currentBid, 0.05);
  const paidSeller = seller
    ? { ...seller, soldier: { ...seller.soldier, coins: seller.soldier.coins + sellerRevenue } }
    : seller;

  let awardedWinner = winner;
  if (winner) {
    const inserted = addInventoryItem(
      winner.soldier.inventory,
      listing.itemId,
      listing.quantity,
      BACKPACK_COLS,
      BACKPACK_ROWS,
      BACKPACK_CHESTS,
    );
    if (!inserted.ok) {
      return {
        listing,
        seller,
        winner,
        result: fail("No tienes espacio en tu inventario para recoger este objeto."),
      };
    }
    awardedWinner = { ...winner, soldier: { ...winner.soldier, inventory: inserted.inventory } };
  }

  return {
    listing: { ...listing, status: "sold" },
    seller: paidSeller,
    winner: awardedWinner,
    result: ok("Subasta cerrada."),
  };
}

function emptyListing(sellerId: string, itemId: string, now: Date): AuctionListingState {
  return {
    id: "invalid",
    sellerId,
    itemId,
    quantity: 1,
    startingBid: 1,
    currentBid: null,
    currentBidderId: null,
    buyoutPrice: null,
    status: "cancelled",
    endsAt: now.toISOString(),
  };
}

function addItemToState(state: GameState, itemId: string, quantity: number) {
  const inserted = addInventoryItem(
    state.soldier.inventory,
    itemId,
    quantity,
    BACKPACK_COLS,
    BACKPACK_ROWS,
    BACKPACK_CHESTS,
  );
  return { ...state, soldier: { ...state.soldier, inventory: inserted.inventory } };
}
