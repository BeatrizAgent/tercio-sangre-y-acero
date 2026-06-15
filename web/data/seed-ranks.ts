import ranksJson from "./json/ranks.json";

export const ranks = ranksJson.map((rank) => ({
  id: rank.id,
  name: rank.name,
  minXp: rank.min_xp,
  minHonor: rank.min_honor,
}));
