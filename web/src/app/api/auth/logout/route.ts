import { jsonResponse, optionsResponse } from "@/lib/api/cors";
import { clearSessionCookieHeader } from "@/lib/auth/session";

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST() {
  return jsonResponse(
    { ok: true },
    { headers: { "Set-Cookie": clearSessionCookieHeader() } },
  );
}
