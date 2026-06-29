import assert from "node:assert/strict";
import {
  SESSION_COOKIE_NAME,
  buildSessionCookie,
  generateRecoveryToken,
  getPublicIpFromRequest,
  getSessionTokenFromCookieHeader,
  hashRecoveryToken,
  isRecoveryTokenFormat,
} from "../../src/lib/auth/session";

const token = generateRecoveryToken();
assert.equal(isRecoveryTokenFormat(token), true);
assert.equal(token.startsWith("tercio_"), true);
assert.ok(token.length >= 32, "token has enough entropy text");

assert.equal(isRecoveryTokenFormat(""), false);
assert.equal(isRecoveryTokenFormat("demo@tercio.local"), false);
assert.equal(isRecoveryTokenFormat("tercio_short"), false);

const hash = hashRecoveryToken(token);
assert.equal(hash, hashRecoveryToken(token));
assert.notEqual(hash, token);
assert.match(hash, /^[a-f0-9]{64}$/);

const cookie = buildSessionCookie(token);
assert.equal(cookie.name, SESSION_COOKIE_NAME);
assert.equal(cookie.value, token);
assert.equal(cookie.httpOnly, true);
assert.equal(cookie.sameSite, "lax");
assert.equal(cookie.path, "/");
assert.equal(getSessionTokenFromCookieHeader(`${SESSION_COOKIE_NAME}=${token}; other=value`), token);
assert.equal(getSessionTokenFromCookieHeader("other=value"), undefined);

const forwardedRequest = new Request("https://tercios.test/login", {
  headers: {
    "x-forwarded-for": "10.0.0.3, 203.0.113.77",
  },
});
assert.equal(getPublicIpFromRequest(forwardedRequest), "203.0.113.77");

const privateRequest = new Request("https://tercios.test/login", {
  headers: {
    "x-forwarded-for": "10.0.0.3, 172.16.0.2",
    "x-real-ip": "192.168.1.5",
  },
});
assert.equal(getPublicIpFromRequest(privateRequest), null);

console.log(JSON.stringify({ ok: true, checked: "auth-session" }, null, 2));
