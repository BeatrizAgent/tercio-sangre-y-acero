import assert from "node:assert/strict";

// Mock browser storage before the store module evaluates its persist middleware.
class MockStorage implements Storage {
  private data = new Map<string, string>();

  get length() {
    return this.data.size;
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }
}

const mockStorage = new MockStorage();

Object.defineProperty(globalThis, "localStorage", {
  value: mockStorage,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, "window", {
  value: globalThis,
  writable: true,
  configurable: true,
});

async function main() {
  const { useGameStore } = await import("../../src/lib/stores/game-store");
  const { createJSONStorage } = await import("zustand/middleware");

  // Force persist to use our mock storage in case it already selected none.
  if (useGameStore.persist) {
    useGameStore.persist.setOptions({
      storage: createJSONStorage(() => mockStorage),
    });
    await useGameStore.persist.rehydrate();
  }

  {
    useGameStore.getState().resetState();
    const store = useGameStore.getState();
    assert.equal(store.soldier.name, "Diego de Arce", "initial soldier name");
    assert.equal(store.soldier.coins, 25, "initial coins");
    assert.ok(store.characters.length > 0, "characters loaded");
    assert.equal(store.activeCharacterId, "diego_de_arce", "active character is Diego");
    assert.ok(typeof store.trainStat === "function", "trainStat action exists");
    assert.ok(typeof store.buyItem === "function", "buyItem action exists");
    assert.ok(typeof store.equipItem === "function", "equipItem action exists");
    assert.ok(typeof store.startMission === "function", "startMission action exists");
  }

  {
    // Server events are the seam for the future Django backend.
    useGameStore.getState().resetState();
    useGameStore.getState().applyServerEvent({
      type: "leaderboard.updated",
      entries: [{ rank: 1, playerId: "p1", playerName: "Test", honor: 10, reputation: 0 }],
    });
    assert.equal(useGameStore.getState().leaderboard?.length, 1, "leaderboard updated");
  }

  {
    useGameStore.getState().resetState();
    useGameStore.getState().applyServerEvent({
      type: "notification.new",
      notification: { id: "n1", type: "report", title: "T", body: "B", read: false, createdAt: "2024-01-01" },
    });
    assert.equal(useGameStore.getState().notifications?.length, 1, "notification added");
    useGameStore.getState().applyServerEvent({ type: "notification.read", notificationId: "n1" });
    assert.equal(useGameStore.getState().notifications?.[0].read, true, "notification marked read");
  }

  {
    useGameStore.getState().resetState();
    useGameStore.getState().applyServerEvent({
      type: "guild.member.joined",
      member: { id: "m1", name: "Soldado", role: "Piquero", rank: "bisono", isOnline: true, contribution: 0 },
    });
    assert.equal(useGameStore.getState().guildMembers?.length, 1, "guild member joined");
    useGameStore.getState().applyServerEvent({ type: "guild.member.left", memberId: "m1" });
    assert.equal(useGameStore.getState().guildMembers?.length, 0, "guild member left");
  }

  console.log(JSON.stringify({ ok: true, checked: "game-store" }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
