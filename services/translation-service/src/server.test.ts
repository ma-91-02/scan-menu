import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import { createApp } from "./server.js";

let server: Server;
let baseUrl: string;

before(() => {
  server = createApp().listen(0);
  const address = server.address();

  assert(address && typeof address === "object");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => {
  server.close();
});

test("loads supported languages from translation-service", async () => {
  const response = await fetch(`${baseUrl}/languages`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.ok(payload.data.some((language: { code: string }) => language.code === "ar"));
});

test("localizes public page with Arabic RTL direction", async () => {
  const response = await fetch(`${baseUrl}/public-page?language=ar`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.language, "ar");
  assert.equal(payload.data.direction, "rtl");
  assert.match(payload.data.hero.title, /زائر/);
});

test("translates known order notes", async () => {
  const response = await fetch(`${baseUrl}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "no onions",
      sourceLanguage: "en",
      targetLanguage: "ru"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.sourceText, "no onions");
  assert.equal(payload.data.translatedText, "без лука");
});

test("translates menu ingredient names centrally", async () => {
  const response = await fetch(`${baseUrl}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "onion",
      sourceLanguage: "en",
      targetLanguage: "ar"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.translatedText, "بصل");
});
