// combat-animation.test.ts — coverage of the animation script and presets.

import assert from "node:assert/strict";
import { combatAnimationScript } from "../../src/lib/domain/combat/combat-animation-script";
import { combatAnimationPreset, combatShakePreset } from "../../src/lib/domain/combat/animation-presets";
import { getLinearFrameIndex } from "../../src/lib/domain/combat/diego-sprite-sheets";

// combatAnimationScript -------------------------------------------------

{
  // The script is non-empty and monotonically increasing.
  assert.ok(combatAnimationScript.length > 0);
  for (let i = 1; i < combatAnimationScript.length; i++) {
    const prev = combatAnimationScript[i - 1];
    const curr = combatAnimationScript[i];
    assert.ok(curr.at >= prev.at, `at[${i}] (${curr.at}) >= at[${i - 1}] (${prev.at})`);
  }
  // Every entry has a string label and a known phase.
  for (const entry of combatAnimationScript) {
    assert.equal(typeof entry.at, "number");
    assert.ok(entry.at >= 0);
    assert.equal(typeof entry.label, "string");
    assert.ok(entry.label.length > 0);
  }
}

{
  // The script covers all canonical combat phases from combat-types.
  const phases = new Set(combatAnimationScript.map((e) => e.phase));
  for (const expected of [
    "fade-in",
    "title",
    "deployment",
    "modifiers",
    "shot",
    "response",
    "outcome",
  ]) {
    assert.ok(phases.has(expected as never), `phase ${expected} present in script`);
  }
}

// combatAnimationPreset -------------------------------------------------

{
  // The preset's outcomeMs matches the script's last cue.
  const last = combatAnimationScript[combatAnimationScript.length - 1];
  assert.equal(combatAnimationPreset.outcomeMs, last.at, "outcomeMs == last cue");
  // fadeInMs is the start of the title phase (script's second cue).
  const titleCue = combatAnimationScript.find((c) => c.phase === "title");
  assert.ok(titleCue);
  assert.equal(combatAnimationPreset.fadeInMs, titleCue!.at, "fadeInMs == title cue");
  // Coordinates make sense.
  assert.ok(combatAnimationPreset.playerReadyX > 0);
  assert.ok(combatAnimationPreset.enemyReadyX > combatAnimationPreset.playerReadyX);
}

{
  // Shake preset has positive magnitudes and a decay in (0,1).
  assert.ok(combatShakePreset.shot > 0);
  assert.ok(combatShakePreset.clash > 0);
  assert.ok(combatShakePreset.decay > 0 && combatShakePreset.decay < 1);
}

// getLinearFrameIndex ---------------------------------------------------

{
  // 0 ms -> frame 0.
  assert.equal(getLinearFrameIndex(0, 6, 100), 0);
  // 99 ms -> frame 0.
  assert.equal(getLinearFrameIndex(99, 6, 100), 0);
  // 100 ms -> frame 1.
  assert.equal(getLinearFrameIndex(100, 6, 100), 1);
  // 599 ms -> frame 5.
  assert.equal(getLinearFrameIndex(599, 6, 100), 5);
  // 600 ms -> frame 5 (clamped to last).
  assert.equal(getLinearFrameIndex(600, 6, 100), 5);
  // Very large elapsed -> clamped to last.
  assert.equal(getLinearFrameIndex(99_999_999, 6, 100), 5);
}

{
  // frameCount <= 1 -> always 0.
  assert.equal(getLinearFrameIndex(0, 0, 100), 0);
  assert.equal(getLinearFrameIndex(0, 1, 100), 0);
  assert.equal(getLinearFrameIndex(500, 1, 100), 0);
}

{
  // Negative elapsed -> clamped to 0.
  assert.equal(getLinearFrameIndex(-100, 6, 100), 0);
}

console.log(JSON.stringify({ ok: true, checked: "combat-animation" }, null, 2));
