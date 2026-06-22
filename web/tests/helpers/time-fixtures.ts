// Test helpers for deterministic timestamps.
// Freezes Date.now() during a test so report/wound/arena ids are predictable.

const FIXED_EPOCH_MS = 1_735_689_600_000;

export function freezeClock<T>(fn: () => T): T {
  const original = Date.now;
  Date.now = () => FIXED_EPOCH_MS;
  try {
    return fn();
  } finally {
    Date.now = original;
  }
}

export function fixedTimestamp(): number {
  return FIXED_EPOCH_MS;
}
