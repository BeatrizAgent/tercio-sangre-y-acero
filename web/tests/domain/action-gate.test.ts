import assert from "node:assert/strict";
import { prepareActionGate, verifyActionGate } from "../../src/lib/domain/action-gate";

const now = new Date("2026-06-23T10:00:00.000Z").getTime();
const gate = prepareActionGate({
  kind: "arena",
  targetId: "bot_1",
  nowMs: now,
  secret: "test_secret",
});

assert.equal(gate.waitMs, 0, "gate has no wait");
assert.equal(gate.notBefore, now, "gate is ready immediately");
assert.equal(
  verifyActionGate({ token: gate.token, kind: "arena", targetId: "bot_1", nowMs: now, secret: "test_secret" }).ok,
  true,
  "gate accepts immediately",
);
assert.equal(
  verifyActionGate({ token: gate.token, kind: "mission", targetId: "bot_1", nowMs: now, secret: "test_secret" }).ok,
  false,
  "gate binds token to action kind",
);

console.log(JSON.stringify({ ok: true, checked: "action-gate" }, null, 2));
