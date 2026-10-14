import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { hashPassword, verifyPassword } from "../src/lib/passwords";
import { adminPassword, authSecret } from "../src/lib/auth-config";

test("scrypt : sel unique, mot de passe correct et refus d'un mauvais mot de passe", async () => {
  const first = await hashPassword("participant-test-123");
  const second = await hashPassword("participant-test-123");
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("participant-test-123", first), true);
  assert.equal(await verifyPassword("incorrect", first), false);
  assert.equal(await verifyPassword("test", "scrypt:invalid"), false);
});

test("les mots de passe historiques restent vérifiables", async () => {
  const legacy = createHash("sha256").update(`ancien::${authSecret()}`).digest("hex");
  assert.equal(await verifyPassword("ancien", legacy), true);
  assert.equal(await verifyPassword("autre", legacy), false);
});

test("production : refuse les secrets absents ou par défaut", () => {
  const original = { ...process.env };
  try {
    Object.assign(process.env, { NODE_ENV: "production" });
    delete process.env.AUTH_SECRET;
    delete process.env.ADMIN_PASSWORD;
    assert.throws(authSecret);
    assert.throws(adminPassword);
    process.env.AUTH_SECRET = "change-me-secret";
    process.env.ADMIN_PASSWORD = "box-admin";
    assert.throws(authSecret);
    assert.throws(adminPassword);
    process.env.AUTH_SECRET = "a-production-secret-at-least-32-characters";
    process.env.ADMIN_PASSWORD = "a-strong-admin-password";
    assert.doesNotThrow(authSecret);
    assert.doesNotThrow(adminPassword);
  } finally {
    process.env = original;
  }
});
