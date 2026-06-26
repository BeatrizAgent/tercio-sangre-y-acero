/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "node:assert/strict";
import { checkAndRotateSystemAuctions } from "../../src/lib/actions/market";

// Mock DB implementation
class MockDatabase {
  listings: any[] = [];
  bids: any[] = [];
  messages: any[] = [];
  soldiers: any[] = [
    { id: "bot_alonso", name: "Alonso del Barro" },
    { id: "bot_mateo", name: "Mateo Cuerda" }
  ];

  auctionListing = {
    findMany: async (args: any) => {
      let filtered = [...this.listings];
      if (args?.where) {
        filtered = filtered.filter(item => {
          if (args.where.sellerId && item.sellerId !== args.where.sellerId) return false;
          if (typeof args.where.status === "string" && item.status !== args.where.status) return false;
          if (args.where.status?.in && !args.where.status.in.includes(item.status)) return false;
          if (args.where.endsAt?.lte && item.endsAt > args.where.endsAt.lte) return false;
          return true;
        });
      }
      if (args?.take) return filtered.slice(0, args.take);
      return filtered;
    },
    count: async (args: any) => (await this.auctionListing.findMany(args)).length,
    update: async (args: any) => {
      const listing = this.listings.find(l => l.id === args.where.id);
      if (listing) {
        Object.assign(listing, args.data);
      }
      return listing;
    },
    deleteMany: async (args: any) => {
      // Mock delete
      const beforeCount = this.listings.length;
      if (args?.where?.OR) {
        this.listings = this.listings.filter(item => {
          let matchesOr = false;
          for (const cond of args.where.OR) {
            if (cond.status && item.status === cond.status) matchesOr = true;
          }
          return !matchesOr;
        });
      }
      return { count: beforeCount - this.listings.length };
    },
    create: async (args: any) => {
      const newListing = { ...args.data };
      this.listings.push(newListing);
      return newListing;
    },
    createMany: async (args: any) => {
      this.listings.push(...args.data.map((row: any) => ({ ...row })));
      return { count: args.data.length };
    },
  };

  soldier = {
    findMany: async (args: any) => {
      if (args?.where?.user?.isBot) {
        return this.soldiers;
      }
      return [];
    }
  };

  auctionBid = {
    create: async (args: any) => {
      const newBid = { id: `bid_${Date.now()}`, ...args.data };
      this.bids.push(newBid);
      return newBid;
    }
  };

  gameMessage = {
    upsert: async (args: any) => {
      const key = args.where.recipientId_kind_auctionListingId;
      const existing = this.messages.find((message) =>
        message.recipientId === key.recipientId &&
        message.kind === key.kind &&
        message.auctionListingId === key.auctionListingId
      );
      if (existing) return existing;
      const created = { id: `msg_${this.messages.length + 1}`, ...args.create };
      this.messages.push(created);
      return created;
    },
  };

  $transaction = async (cb: any) => {
    return cb(this);
  };
}

// Test Suite
(async () => {
  // Test 1: Generates new system auctions when none exist
  {
    const db = new MockDatabase() as any;
    const now = new Date("2026-06-26T10:30:00.000Z");

    await checkAndRotateSystemAuctions(db, now);

    assert.equal(db.listings.length, 8, "Should generate exactly 8 recipe items");
    const endsAt = new Date(db.listings[0].endsAt);
    assert.equal(endsAt.getUTCHours(), 12, "Should align endsAt to next even hour (12:00)");
    assert.equal(endsAt.getUTCMinutes(), 0, "EndsAt minutes should be 0");
    assert.ok(db.listings.every((l: any) => l.sellerId === "system"), "All listings should be system-owned");
    assert.equal(db.listings.filter((l: any) => l.id.includes("_legendary_")).length, 2, "Should include 2 top-tier lots");
    assert.equal(db.listings.filter((l: any) => l.id.includes("_common_")).length, 2, "Should include 2 common lots");
    assert.equal(db.listings.filter((l: any) => l.id.includes("_food_")).length, 2, "Should include 2 food lots");
  }

  // Test 2: Resolves expired active system listings
  {
    const db = new MockDatabase() as any;
    const now = new Date("2026-06-26T12:05:00.000Z"); // Past 12:00

    // Set up an expired listing
    db.listings.push({
      id: "system_item_1",
      sellerId: "system",
      itemId: "consumable_pan_duro_001",
      quantity: 1,
      startingBid: 10,
      currentBid: 12,
      currentBidderId: "soldier_player_1",
      status: "active",
      endsAt: new Date("2026-06-26T12:00:00.000Z"),
      createdAt: new Date("2026-06-26T10:00:00.000Z")
    });

    await checkAndRotateSystemAuctions(db, now);

    const oldListing = db.listings.find((l: any) => l.id === "system_item_1");
    assert.equal(oldListing?.status, "sold", "Expired listing should close as sold");
    assert.equal(db.messages.length, 1, "Winner should receive an auction message");
    assert.equal(db.listings.filter((l: any) => l.status === "active").length, 8, "A new batch of 8 items should be active");
  }

  // Test 3: Simulates bot bidding for active listings
  {
    const db = new MockDatabase() as any;
    // Set up active system listing that is exactly halfway through
    const createdAt = new Date("2026-06-26T10:00:00.000Z");
    const endsAt = new Date("2026-06-26T12:00:00.000Z");
    const now = new Date("2026-06-26T11:00:00.000Z"); // 50% elapsed

    db.listings.push({
      id: "system_test_listing_1",
      sellerId: "system",
      itemId: "weapon_pica_gastada_001",
      quantity: 1,
      startingBid: 10,
      currentBid: null,
      currentBidderId: null,
      status: "active",
      endsAt,
      createdAt
    });

    await checkAndRotateSystemAuctions(db, now);

    // Check if a bot bid was placed
    const listing = db.listings.find((l: any) => l.id === "system_test_listing_1");
    assert.ok(listing, "Listing should exist");
    
    // Check if the currentBidderId matches one of the bots
    assert.ok(
      listing.currentBidderId === "bot_alonso" || listing.currentBidderId === "bot_mateo",
      "Current bidder should be a bot"
    );
    assert.ok(listing.currentBid > 10, "Bid should have increased above starting bid");
    assert.equal(db.bids.length, 1, "Should have created a bid history entry");
  }

  console.log(JSON.stringify({ ok: true, checked: "system-auction" }, null, 2));
})();
