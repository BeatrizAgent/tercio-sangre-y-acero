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
  return prepareActionGate({ kind, targetId, secret: getActionGateSecret() });
}
