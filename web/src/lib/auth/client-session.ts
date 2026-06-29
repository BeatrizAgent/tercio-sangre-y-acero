"use client";

export const missingSessionRedirect = "/login?reason=missing-session";

export async function handleAuthFailure(options: { signal?: AbortSignal } = {}) {
  await fetch("/api/auth/logout", {
    method: "POST",
    signal: options.signal,
  }).catch(() => undefined);

  if (options.signal?.aborted || typeof window === "undefined") return;
  window.location.replace(missingSessionRedirect);
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const response = await fetch(input, init);
  if (response.status === 401) {
    await handleAuthFailure({ signal: init.signal ?? undefined });
  }
  return response;
}
