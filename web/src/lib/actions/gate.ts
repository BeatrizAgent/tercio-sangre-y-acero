"use server";

import { prepareActionGate, type ActionGateKind } from "../domain/action-gate";
import { getActionGateSecret } from "../server/action-gate-secret";

export async function prepareActionGateAction({
  kind,
  targetId,
}: {
  kind: ActionGateKind;
  targetId: string;
}) {
  const waitMs = kind === "mission" ? 0 : undefined;
  return prepareActionGate({ kind, targetId, waitMs, secret: getActionGateSecret() });
}
