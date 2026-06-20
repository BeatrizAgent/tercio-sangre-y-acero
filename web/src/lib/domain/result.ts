// Standard return shape for every domain action. Carries the ok flag, a
// human-readable message (Spanish in-game copy), and an optional payload
// that some actions need (e.g. reportId after a mission).

export interface ActionResult<T = unknown> {
  ok: boolean;
  message: string;
  data?: T;
}

export function ok<T = unknown>(message: string, data?: T): ActionResult<T> {
  return { ok: true, message, data };
}

export function fail<T = unknown>(message: string): ActionResult<T> {
  return { ok: false, message };
}
