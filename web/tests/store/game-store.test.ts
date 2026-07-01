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
    assert.equal(store.characters.length, 1, "only the player character is loaded initially");
    assert.equal(store.characters[0].id, "diego_de_arce", "initial roster has Diego only");
    assert.equal(store.activeCharacterId, "diego_de_arce", "active character is Diego");
    assert.ok(typeof store.trainStat === "function", "trainStat action exists");
    assert.ok(typeof store.buyItem === "function", "buyItem action exists");
    assert.ok(typeof store.equipItem === "function", "equipItem action exists");
    assert.ok(typeof store.startMission === "function", "startMission action exists");
    assert.ok(typeof store.resolveStoryChoice === "function", "resolveStoryChoice action exists");
    assert.equal(store.storyProgress?.currentChapterId, "cap1_choza_castellana", "story starts at chapter 1");
  }

  {
    useGameStore.getState().resetState();
    const { createCharacterStates } = await import("../../src/lib/data/characters");
    const { recruitmentCandidates } = await import("../../src/lib/data/recruitment");
    const catalogDump = createCharacterStates();
    useGameStore.getState().hydrateState({
      ...useGameStore.getState(),
      characters: catalogDump,
      activeCharacterId: catalogDump[1]?.id ?? "mock_character",
    });
    const store = useGameStore.getState();
    assert.deepEqual(
      store.characters.map((character) => character.id),
      ["diego_de_arce"],
      "catalog dump is pruned to the protagonist",
    );
    assert.equal(store.activeCharacterId, "diego_de_arce", "active character resets to protagonist after pruning");

    const recruit = recruitmentCandidates[0];
    useGameStore.getState().hydrateState({
      ...store,
      characters: [store.characters[0], { ...recruit.character, unlocked: true }, ...catalogDump],
      activeCharacterId: recruit.character.id,
    });
    assert.deepEqual(
      useGameStore.getState().characters.map((character) => character.id),
      ["diego_de_arce", recruit.character.id],
      "real recruited candidates survive roster pruning",
    );
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

  // setActiveCharacter --------------------------------------------------

  {
    useGameStore.getState().resetState();
    // Add a known second character.
    const { recruitmentCandidates } = await import("../../src/lib/data/recruitment");
    const recruit = recruitmentCandidates[0];
    useGameStore.getState().hydrateState({
      ...useGameStore.getState(),
      characters: [
        ...useGameStore.getState().characters,
        { ...recruit.character, unlocked: true },
      ],
    });
    const before = useGameStore.getState().activeCharacterId;
    const newId = recruit.character.id;
    useGameStore.getState().setActiveCharacter(newId);
    assert.equal(useGameStore.getState().activeCharacterId, newId, "active character changed");
    // Unknown id is a no-op.
    useGameStore.getState().setActiveCharacter("nonexistent");
    assert.equal(useGameStore.getState().activeCharacterId, newId, "unknown id is a no-op");
    // Reset back.
    useGameStore.getState().setActiveCharacter(before);
  }

  // setFormationSlot ---------------------------------------------------

  {
    useGameStore.getState().resetState();
    const targetChar = useGameStore.getState().characters[0].id;
    useGameStore.getState().setFormationSlot(targetChar, "apoyo");
    const after = useGameStore.getState().characters.find((c) => c.id === targetChar);
    assert.equal(after?.formationSlot, "apoyo", "formation slot updated");
  }

  // payChurchErrand ---------------------------------------------------

  {
    useGameStore.getState().resetState();
    // payChurchErrand is a flat coin-deduction (no ban check): just verify
    // success and insufficient-coins paths.
    useGameStore.setState({ soldier: { ...useGameStore.getState().soldier, coins: 5 } });
    const poor = useGameStore.getState().payChurchErrand(50);
    assert.equal(poor.ok, false);
    assert.match(poor.message, /insuficientes/);
    useGameStore.setState({ soldier: { ...useGameStore.getState().soldier, coins: 100 } });
    const ok = useGameStore.getState().payChurchErrand(30);
    assert.equal(ok.ok, true);
    assert.equal(useGameStore.getState().soldier.coins, 70);
    // payTownBribe is a separate action that DOES require a ban.
    const noBan = useGameStore.getState().payTownBribe();
    assert.equal(noBan.ok, false);
    useGameStore.setState({ soldier: { ...useGameStore.getState().soldier, banMissionsLeft: 1, coins: 5 } });
    const poorBribe = useGameStore.getState().payTownBribe();
    assert.equal(poorBribe.ok, false);
    assert.match(poorBribe.message, /sobornar/);
    useGameStore.setState({ soldier: { ...useGameStore.getState().soldier, banMissionsLeft: 1, coins: 100 } });
    const bribe = useGameStore.getState().payTownBribe();
    assert.equal(bribe.ok, true);
    assert.equal(useGameStore.getState().soldier.coins, 50);
    assert.equal(useGameStore.getState().soldier.banMissionsLeft, 0);
  }

  // moveInventoryItem -------------------------------------------------

  {
    useGameStore.getState().resetState();
    // Items start positioned by auto-layout. Find vendas.
    const vendas = useGameStore.getState().soldier.inventory.find((i) => i.itemId === "consumable_vendas_001");
    assert.ok(vendas, "vendas present in initial state");
    // Move vendas to (7, 4) chest 0.
    const out = useGameStore.getState().moveInventoryItem("consumable_vendas_001", 7, 4, 0);
    assert.equal(out.ok, true);
    const moved = useGameStore.getState().soldier.inventory.find((i) => i.itemId === "consumable_vendas_001");
    assert.equal(moved?.x, 7);
    assert.equal(moved?.y, 4);
    // Move to occupied cell -> no-op.
    const before = JSON.stringify(useGameStore.getState().soldier.inventory);
    const failed = useGameStore.getState().moveInventoryItem("consumable_vendas_001", 0, 0, 0);
    assert.equal(failed.ok, false);
    assert.equal(JSON.stringify(useGameStore.getState().soldier.inventory), before, "no-op on occupied");
  }

  // startMission edges ------------------------------------------------

  {
    useGameStore.getState().resetState();
    // Spend all action points.
    useGameStore.setState({ soldier: { ...useGameStore.getState().soldier, actionPoints: 0 } });
    const noPoints = useGameStore.getState().startMission("mission_guardia_noche_001");
    assert.equal(noPoints.ok, false);
    assert.match(noPoints.message, /puntos de acci.n/);
  }

  {
    useGameStore.getState().resetState();
    // Soldier banned for 1 mission.
    useGameStore.setState({ soldier: { ...useGameStore.getState().soldier, banMissionsLeft: 1 } });
    const out = useGameStore.getState().startMission("mission_guardia_noche_001");
    // The store still resolves the mission; the ban counter is decremented.
    assert.equal(useGameStore.getState().soldier.banMissionsLeft, 0, "ban decremented");
    // Result is ok regardless.
    assert.equal(typeof out.ok, "boolean");
  }

  {
    useGameStore.getState().resetState();
    // Unknown mission id.
    const out = useGameStore.getState().startMission("mision_inexistente_zzz");
    assert.equal(out.ok, false);
    assert.match(out.message, /desconocida/);
  }

  // treatWound edges --------------------------------------------------

  {
    useGameStore.getState().resetState();
    // No wounds -> no-op.
    const out = useGameStore.getState().treatWound("wound_1");
    assert.equal(out.ok, false);
  }

  {
    useGameStore.getState().resetState();
    // Add a wound but no bandages.
    useGameStore.setState({
      soldier: {
        ...useGameStore.getState().soldier,
        inventory: [],
        wounds: [{ id: "w_1", woundId: "wound_corte_mano_001", treated: false }],
      },
    });
    const out = useGameStore.getState().treatWound("w_1");
    assert.equal(out.ok, false);
    assert.match(out.message, /vendas/i);
  }

  // recruitCandidate happy path ---------------------------------------

  {
    useGameStore.getState().resetState();
    const { recruitmentCandidates } = await import("../../src/lib/data/recruitment");
    const paid = recruitmentCandidates.find((c) => c.id === "tomas_de_orduna");
    assert.ok(paid);
    // Bump xp to 400 to unlock the first slot.
    useGameStore.setState({ soldier: { ...useGameStore.getState().soldier, xp: 400, coins: 200 } });
    const out = useGameStore.getState().recruitCandidate("tomas_de_orduna");
    assert.equal(out.ok, true);
    assert.ok(
      useGameStore.getState().characters.some((c) => c.id === paid.character.id),
      "character added",
    );
  }

  // resolveActiveEventChoice happy path -------------------------------

  {
    useGameStore.getState().resetState();
    const { eventDefinitions } = await import("../../src/lib/data/events");
    const event = eventDefinitions[0];
    useGameStore.setState({ activeEvent: event, pendingMissionId: "mission_guardia_noche_001" });
    const choice = event.choices[0];
    const beforeHonor = useGameStore.getState().soldier.honor;
    const out = useGameStore.getState().resolveActiveEventChoice(choice.id);
    assert.equal(out.ok, true);
    // Honor at least reflects the choice effect (could be higher from mission).
    assert.ok(useGameStore.getState().soldier.honor >= beforeHonor);
  }

  // resolveStoryChoice happy path ------------------------------------

  {
    useGameStore.getState().resetState();
    const beforeXp = useGameStore.getState().soldier.xp;
    const out = useGameStore.getState().resolveStoryChoice("cap1_choza_castellana", "shield_brother");
    assert.equal(out.ok, true, "story choice succeeds");
    assert.equal(useGameStore.getState().soldier.xp, beforeXp + 5, "story grants xp");
    assert.equal(useGameStore.getState().storyProgress?.currentChapterId, "cap1_recuerdo_madre", "story advances");
  }

  {
    useGameStore.getState().resetState();
    useGameStore.setState({
      storyProgress: {
        arcId: "prologue_castilla",
        currentChapterId: "cap1_recuerdo_madre",
        completedChapterIds: ["cap1_choza_castellana"],
        choices: { cap1_choza_castellana: "shield_brother" },
      },
    });
    const resolved = useGameStore.getState().resolveStoryChoice("cap1_recuerdo_madre", "sing_low");
    assert.equal(resolved.ok, true, "chapter 2 resolves without a puzzle gate");
  }

  // applyServerEvent: exhaustive -------------------------------------

  {
    // default branch: unknown event type is unreachable via the typed API,
    // but the exhaustive check is exercised at the type level. We test the
    // known branches one more time to make sure they all still work.
    useGameStore.getState().resetState();
    useGameStore.getState().applyServerEvent({
      type: "leaderboard.updated",
      entries: [
        { rank: 1, playerId: "p1", playerName: "Alpha", honor: 10, reputation: 0 },
        { rank: 2, playerId: "p2", playerName: "Beta", honor: 5, reputation: 1 },
      ],
    });
    assert.equal(useGameStore.getState().leaderboard?.length, 2);
  }

  {
    // guild.member.joined with an existing member -> deduped by id.
    useGameStore.getState().resetState();
    useGameStore.getState().applyServerEvent({
      type: "guild.member.joined",
      member: { id: "m1", name: "Old", role: "Piquero", rank: "bisono", isOnline: true, contribution: 0 },
    });
    useGameStore.getState().applyServerEvent({
      type: "guild.member.joined",
      member: { id: "m1", name: "New", role: "Arcabucero", rank: "soldado", isOnline: false, contribution: 1 },
    });
    assert.equal(useGameStore.getState().guildMembers?.length, 1, "dedup");
    assert.equal(useGameStore.getState().guildMembers?.[0].name, "New");
  }

  console.log(JSON.stringify({ ok: true, checked: "game-store" }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
