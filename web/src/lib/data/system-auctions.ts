export const SYSTEM_AUCTION_REFRESH_HOURS = 2;

export const SYSTEM_AUCTION_PLAN = [
  { id: "legendary", label: "Legendarios", count: 2 },
  { id: "common", label: "Comunes", count: 2 },
  { id: "food", label: "Alimento", count: 2 },
  { id: "medical", label: "Cirujano", count: 1 },
  { id: "munition", label: "Municion", count: 1 },
] as const;

export const SYSTEM_AUCTION_COUNT = SYSTEM_AUCTION_PLAN.reduce((sum, slot) => sum + slot.count, 0);

export type SystemAuctionPlanSlotId = (typeof SYSTEM_AUCTION_PLAN)[number]["id"];
