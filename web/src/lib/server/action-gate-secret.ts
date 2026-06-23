export function getActionGateSecret() {
  return (
    process.env.TERCIO_ACTION_GATE_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.DATABASE_URL ??
    "tercio-dev-action-gate"
  );
}
