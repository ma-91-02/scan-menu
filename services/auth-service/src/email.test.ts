import assert from "node:assert/strict";
import { test } from "node:test";
import { supportedLanguages } from "@babili/shared";
import {
  buildPasswordResetEmailHtml,
  buildVerificationEmailHtml,
  getEmailCopy,
  getEmailCopyCoverage,
} from "./email.js";

test("email verification and password reset copy covers all supported languages", () => {
  const coverage = getEmailCopyCoverage();

  assert.equal(coverage.length, supportedLanguages.length);
  assert.deepEqual(
    coverage.filter((item) => !item.ok),
    [],
  );

  for (const language of supportedLanguages) {
    const copy = getEmailCopy(String(language.code));
    assert.equal(copy.direction, language.direction);
    assert.ok(copy.verifySubject);
    assert.ok(copy.resetSubject);
    assert.ok(copy.verifyAction);
    assert.ok(copy.resetAction);
  }
});

test("email links preserve selected language", () => {
  const verification = buildVerificationEmailHtml({
    to: "demo@example.com",
    language: "fa",
    name: "Demo",
    token: "verification-token",
    url: "http://localhost:3000/verify-email?token=verification-token&lang=fa",
  });
  const reset = buildPasswordResetEmailHtml({
    to: "demo@example.com",
    language: "ja",
    name: "Demo",
    token: "reset-token",
    url: "http://localhost:3000/reset-password?token=reset-token&lang=ja",
  });

  assert.match(verification, /dir="rtl"/);
  assert.match(verification, /lang=fa/);
  assert.match(reset, /dir="ltr"/);
  assert.match(reset, /lang=ja/);
});
