// Barrel re-export for the data layer. Consumers should import from this
// file (or from specific submodules when only a slice is needed). The
// legacy `lib/game-data.ts` is a re-export of this file, kept for backward
// compatibility until consumers migrate.

export * from "./assets";
export * from "./ui-paths";
export * from "./items";
export * from "./missions";
export * from "./ranks";
export * from "./wounds";
export * from "./events";
export * from "./enemies";
export * from "./characters";
export * from "./report-fragments";
export * from "./training";
export * from "./regions";
export * from "./recruitment";
export * from "./shop";
export * from "./arena";
export * from "./character-names";
export * from "./player-portraits";
