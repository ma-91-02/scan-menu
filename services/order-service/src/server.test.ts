import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { after, before, test } from "node:test";
import { createApp } from "./server.js";

let translationBackend: Server;
let orderServer: Server;
let translationUrl: string;
let orderUrl: string;
let createdOrderId: string;

before(() => {
  translationBackend = createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/translate") {
      res.statusCode = 404;
      res.end();
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += String(chunk);
    });
    req.on("end", () => {
      const input = JSON.parse(body) as { text: string; sourceLanguage: string; targetLanguage: string };
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          data: {
            sourceText: input.text,
            sourceLanguage: input.sourceLanguage,
            targetLanguage: input.targetLanguage,
            translatedText: "без лука",
            provider: "test"
          }
        })
      );
    });
  }).listen(0);

  const translationAddress = translationBackend.address();
  assert(translationAddress && typeof translationAddress === "object");
  translationUrl = `http://127.0.0.1:${translationAddress.port}`;

  orderServer = createApp({ translationServiceUrl: translationUrl }).listen(0);
  const orderAddress = orderServer.address();
  assert(orderAddress && typeof orderAddress === "object");
  orderUrl = `http://127.0.0.1:${orderAddress.port}`;
});

after(() => {
  orderServer.close();
  translationBackend.close();
});

test("creates orders preserving customer and restaurant language output", async () => {
  const response = await fetch(`${orderUrl}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      restaurantId: "rst_bistro_01",
      customerId: "usr_customer",
      customerLanguage: "ar",
      restaurantLanguage: "ru",
      lines: [
        {
          menuItemId: "mi_salmon_bowl",
          quantity: 1,
          customerNote: "بدون بصل"
        }
      ]
    })
  });
  const payload = await response.json();
  const line = payload.data.lines[0];
  createdOrderId = payload.data.id;

  assert.equal(response.status, 201);
  assert.equal(payload.data.customerLanguage, "ar");
  assert.equal(payload.data.restaurantLanguage, "ru");
  assert.equal(line.customerItemName, "وعاء السلمون");
  assert.equal(line.restaurantItemName, "Боул с лососем");
  assert.equal(line.customerNote, "بدون بصل");
  assert.equal(line.restaurantNote, "без лука");
  assert.equal(payload.data.displayLines[0].displayName, "Боул с лососем");
  assert.equal(payload.data.displayLines[0].displayNote, "без лука");
});

test("updates kitchen line status and marks order ready", async () => {
  const response = await fetch(`${orderUrl}/${createdOrderId}/lines/mi_salmon_bowl/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kitchenStatus: "ready" })
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.status, "ready");
  assert.equal(payload.data.lines[0].kitchenStatus, "ready");
});

test("updates cashier payment status", async () => {
  const response = await fetch(`${orderUrl}/${createdOrderId}/payment`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentMethod: "card", paymentStatus: "paid" })
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.paymentMethod, "card");
  assert.equal(payload.data.paymentStatus, "paid");
});
