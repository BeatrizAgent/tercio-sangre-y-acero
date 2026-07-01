// action-gate-full.test.ts — exhaustive coverage of verifyActionGate edges
// that the basic action-gate.test.ts only spot-checks.

import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { prepareActionGate, verifyActionGate, type ActionGateKind } from "../../src/lib/domain/action-gate";

const now = new Date("2026-06-25T10:00:00.000Z").getTime();
const secret = "extended_test_secret";

{
  // Token is undefined -> rejects with the missing-token message.
  const out = verifyActionGate({ token: undefined, kind: "arena", targetId: "x", nowMs: now, secret });
  assert.equal(out.ok, false);
  assert.match(out.message, /Espera/);
}

{
  // Empty string token -> rejects.
  const out = verifyActionGate({ token: "", kind: "arena", targetId: "x", nowMs: now, secret });
  assert.equal(out.ok, false);
  assert.match(out.message, /Espera/);
}

{
  // Token missing the signature separator -> rejects.
  const out = verifyActionGate({ token: "no-dot-here", kind: "arena", targetId: "x", nowMs: now, secret });
  assert.equal(out.ok, false);
  assert.match(out.message, /inv.lida/i);
}

{
  // Token with valid structure but signature mismatch -> "Orden alterada."
  const out = verifyActionGate({ token: "!!!.goodsignature", kind: "arena", targetId: "x", nowMs: now, secret });
  assert.equal(out.ok, false);
  assert.match(out.message, /alterada/);
}

{
  // Token with base64url-encoded payload that is not valid JSON -> "ilegible".
  // We sign the encoded payload with the right secret so the signature
  // check passes, then JSON.parse fails.
  const garbage = Buffer.from("not json at all").toString("base64url");
  const sig = createHmac("sha256", secret).update(garbage).digest("base64url");
  const out2 = verifyActionGate({ token: `${garbage}.${sig}`, kind: "arena", targetId: "x", nowMs: now, secret });
  assert.equal(out2.ok, false);
  assert.match(out2.message, /ilegible/);
}

{
  // Signature mismatch (different secret) -> rejects.
  const gate = prepareActionGate({ kind: "mission", targetId: "m1", nowMs: now, secret: "signer_a" });
  const out = verifyActionGate({ token: gate.token, kind: "mission", targetId: "m1", nowMs: now, secret: "signer_b" });
  assert.equal(out.ok, false);
  assert.match(out.message, /alterada/);
}

{
  // Same kind, different targetId -> rejects.
  const gate = prepareActionGate({ kind: "arena", targetId: "opponent_1", nowMs: now, secret });
  const out = verifyActionGate({ token: gate.token, kind: "arena", targetId: "opponent_2", nowMs: now, secret });
  assert.equal(out.ok, false);
  assert.match(out.message, /no corresponde/i);
}

{
  // Explicit waitMs is ignored for compatibility; actions still resolve immediately.
  const gate = prepareActionGate({ kind: "arena", targetId: "a", nowMs: now, waitMs: 5_000, secret });
  const out = verifyActionGate({ token: gate.token, kind: "arena", targetId: "a", nowMs: now, secret });
  assert.equal(out.ok, true);
  assert.equal(gate.waitMs, 0);
  assert.equal(gate.notBefore, now);
  assert.equal(out.notBefore, now);
  assert.ok(typeof out.nonce === "string" && out.nonce.length > 0);
}

{
  // Long after creation -> still accepts.
  const gate = prepareActionGate({ kind: "mission", targetId: "m", nowMs: now, waitMs: 1_000, secret });
  const out = verifyActionGate({ token: gate.token, kind: "mission", targetId: "m", nowMs: now + 1_000_000, secret });
  assert.equal(out.ok, true);
}

{
  // Default waitMs is zero: actions are immediate while the token still binds kind/target.
  const gate = prepareActionGate({ kind: "arena", targetId: "a", nowMs: now, secret });
  assert.equal(gate.waitMs, 0);
  assert.equal(gate.notBefore, now);
  const out = verifyActionGate({ token: gate.token, kind: "arena", targetId: "a", nowMs: now, secret });
  assert.equal(out.ok, true);
}

{
  // Every ActionGateKind round-trips.
  const kinds: ActionGateKind[] = ["mission", "arena", "event", "story"];
  for (const kind of kinds) {
    const gate = prepareActionGate({ kind, targetId: "x", nowMs: now, waitMs: 1_000, secret });
    const out = verifyActionGate({ token: gate.token, kind, targetId: "x", nowMs: now, secret });
    assert.equal(out.ok, true, `${kind} round-trip ok`);
  }
}

{
  // Bind to wrong kind -> rejects.
  const gate = prepareActionGate({ kind: "mission", targetId: "x", nowMs: now, secret });
  const out = verifyActionGate({ token: gate.token, kind: "arena", targetId: "x", nowMs: now, secret });
  assert.equal(out.ok, false);
  assert.match(out.message, /no corresponde/);
}

async function main() {
  // verifyActionGate defaults nowMs to Date.now() when omitted.
  const gate = prepareActionGate({ kind: "arena", targetId: "a", nowMs: now, waitMs: 1, secret });
  // Wait 50ms so the gate is certainly open.
  await new Promise((r) => setTimeout(r, 50));
  const out = verifyActionGate({ token: gate.token, kind: "arena", targetId: "a", secret });
  assert.equal(out.ok, true, "verifyActionGate uses Date.now() by default");

  console.log(JSON.stringify({ ok: true, checked: "action-gate-full" }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
