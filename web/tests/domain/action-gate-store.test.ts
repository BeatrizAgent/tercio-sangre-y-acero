import assert from "node:assert/strict";
import { prepareActionGate } from "../../src/lib/domain/action-gate";
import { consumeActionGate } from "../../src/lib/server/action-gate-store";

process.env.TERCIO_ACTION_GATE_SECRET = "consume_test_secret";

const now = new Date("2026-06-23T11:00:00.000Z").getTime();
const gate = prepareActionGate({
  kind: "mission",
  targetId: "mission_test",
  nowMs: now,
  secret: "consume_test_secret",
});

assert.equal(
  consumeActionGate({ token: gate.token, kind: "mission", targetId: "mission_test", nowMs: now + 10_000 }).ok,
  true,
  "first consume succeeds",
);
assert.equal(
  consumeActionGate({ token: gate.token, kind: "mission", targetId: "mission_test", nowMs: now + 10_001 }).ok,
  false,
  "second consume rejects replay",
);

console.log(JSON.stringify({ ok: true, checked: "action-gate-store" }, null, 2));
