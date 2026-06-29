// ranks.test.ts — coverage of getNextRank + getRankName.

import assert from "node:assert/strict";
import { getNextRank, getRankName, rankDefinitions } from "../../src/lib/data/ranks";

{
  // rankDefinitions is non-empty and ordered.
  assert.ok(rankDefinitions.length > 0);
  for (let i = 1; i < rankDefinitions.length; i++) {
    const prev = rankDefinitions[i - 1];
    const curr = rankDefinitions[i];
    assert.ok(
      curr.minXp >= prev.minXp,
      `${curr.id} minXp (${curr.minXp}) >= ${prev.id} minXp (${prev.minXp})`,
    );
  }
}

{
  // getNextRank returns the highest rank whose requirements are met.
  const first = getNextRank(0, 0);
  assert.ok(first, "returns first rank for default");
  assert.equal(first?.id, rankDefinitions[0].id);

  const last = getNextRank(10_000, 1_000);
  assert.ok(last, "returns last rank for max");
  assert.equal(last?.id, rankDefinitions[rankDefinitions.length - 1].id);
}

{
  // Below the first rank: returns null.
  const none = getNextRank(-1, 0);
  assert.equal(none, undefined);
}

{
  // Mid-range: returns the matching rank.
  const mid = rankDefinitions[Math.floor(rankDefinitions.length / 2)];
  const result = getNextRank(mid.minXp, mid.minHonor);
  assert.ok(result);
  assert.equal(result?.id, mid.id);
}

{
  // XP enough but honor not enough: returns lower rank.
  const mid = rankDefinitions[Math.floor(rankDefinitions.length / 2)];
  if (mid.minHonor > 0) {
    const result = getNextRank(mid.minXp, mid.minHonor - 1);
    assert.ok(result, "lower rank still found");
    assert.notEqual(result?.id, mid.id, "different from mid");
    assert.ok(
      rankDefinitions.findIndex((r) => r.id === result?.id) <
        rankDefinitions.findIndex((r) => r.id === mid.id),
    );
  }
}

{
  // getRankName returns the rank's name; unknown -> falls back to the id.
  for (const rank of rankDefinitions) {
    assert.equal(getRankName(rank.id), rank.name);
  }
  assert.equal(getRankName("desconocido"), "desconocido", "fallback to id");
}

console.log(JSON.stringify({ ok: true, checked: "ranks" }, null, 2));
