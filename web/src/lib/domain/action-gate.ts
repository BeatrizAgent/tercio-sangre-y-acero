import { createHmac, timingSafeEqual } from "node:crypto";

export type ActionGateKind = "mission" | "arena" | "event" | "story";

const DEFAULT_WAIT_MS = 0;

export interface PreparedActionGate {
  token: string;
  notBefore: number;
  waitMs: number;
}

export interface ActionGateResult {
  ok: boolean;
  message: string;
  notBefore?: number;
  nonce?: string;
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function prepareActionGate({
  kind,
  targetId,
  nowMs = Date.now(),
  secret,
}: {
  kind: ActionGateKind;
  targetId: string;
  nowMs?: number;
  waitMs?: number;
  secret: string;
}): PreparedActionGate {
  const waitMs = DEFAULT_WAIT_MS;
  const notBefore = nowMs;
  const nonce = `${nowMs.toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  const payload = JSON.stringify({ kind, targetId, notBefore, nonce });
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return {
    token: `${encoded}.${sign(encoded, secret)}`,
    notBefore,
    waitMs,
  };
}

export function verifyActionGate({
  token,
  kind,
  targetId,
  nowMs = Date.now(),
  secret,
}: {
  token: string | undefined;
  kind: ActionGateKind;
  targetId: string;
  nowMs?: number;
  secret: string;
}): ActionGateResult {
  if (!token) return { ok: false, message: "Espera la orden antes de resolver." };
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return { ok: false, message: "Orden inválida." };
  if (!safeEqual(signature, sign(encoded, secret))) return { ok: false, message: "Orden alterada." };

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
      kind?: string;
      targetId?: string;
      notBefore?: number;
      nonce?: string;
    };
    if (payload.kind !== kind || payload.targetId !== targetId || typeof payload.notBefore !== "number") {
      return { ok: false, message: "Orden no corresponde a esta acción." };
    }
    return { ok: true, message: "Orden lista.", notBefore: payload.notBefore, nonce: payload.nonce };
  } catch {
    return { ok: false, message: "Orden ilegible." };
  }
}
