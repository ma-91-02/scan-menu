import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { after, before, test } from "node:test";
import { createApp } from "./server.js";

let backend: Server;
let gateway: Server;
let backendUrl: string;
let gatewayUrl: string;

before(() => {
  backend = createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");

    if (req.url === "/languages") {
      res.end(JSON.stringify({ data: [{ code: "ar", nativeName: "العربية", direction: "rtl" }] }));
      return;
    }

    res.end(JSON.stringify({ data: { ok: true } }));
  }).listen(0);

  const backendAddress = backend.address();
  assert(backendAddress && typeof backendAddress === "object");
  backendUrl = `http://127.0.0.1:${backendAddress.port}`;

  gateway = createApp({
    auth: backendUrl,
    restaurants: backendUrl,
    orders: backendUrl,
    translations: backendUrl
  }).listen(0);

  const gatewayAddress = gateway.address();
  assert(gatewayAddress && typeof gatewayAddress === "object");
  gatewayUrl = `http://127.0.0.1:${gatewayAddress.port}`;
});

after(() => {
  gateway.close();
  backend.close();
});

test("health check does not expose internal service URLs", async () => {
  const response = await fetch(`${gatewayUrl}/health`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.service, "api-gateway");
  assert.equal(payload.data.status, "ok");
  assert.equal(payload.data.services, undefined);
});

test("routes translation requests through the API Gateway", async () => {
  const response = await fetch(`${gatewayUrl}/translations/languages`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data[0].code, "ar");
  assert.equal(payload.data[0].direction, "rtl");
});
