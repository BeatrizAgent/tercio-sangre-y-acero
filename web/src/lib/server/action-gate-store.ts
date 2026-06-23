import { verifyActionGate, type ActionGateKind, type ActionGateResult } from "../domain/action-gate";
import { getActionGateSecret } from "./action-gate-secret";

const consumedGateNonces = new Map<string, number>();
const MAX_AGE_MS = 5 * 60_000;

function prune(nowMs: number) {
  for (const [nonce, usedAt] of consumedGateNonces) {
    if (nowMs - usedAt > MAX_AGE_MS) consumedGateNonces.delete(nonce);
  }
}

export function consumeActionGate({
  token,
  kind,
  targetId,
  nowMs = Date.now(),
}: {
  token: string | undefined;
  kind: ActionGateKind;
  targetId: string;
  nowMs?: number;
}): ActionGateResult {
  const result = verifyActionGate({
    token,
    kind,
    targetId,
    nowMs,
    secret: getActionGateSecret(),
  });
  if (!result.ok) return result;
  if (!result.nonce) return { ok: false, message: "Orden sin sello de consumo." };
  prune(nowMs);
  if (consumedGateNonces.has(result.nonce)) {
    return { ok: false, message: "Orden ya consumida." };
  }
  consumedGateNonces.set(result.nonce, nowMs);
  return result;
}
