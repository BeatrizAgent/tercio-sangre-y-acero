import assert from "node:assert/strict";
import {
  SESSION_COOKIE_NAME,
  buildSessionCookie,
  generateRecoveryToken,
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

console.log(JSON.stringify({ ok: true, checked: "auth-session" }, null, 2));
