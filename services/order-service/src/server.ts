import cors from "cors";
import express from "express";
import type {
  LanguageCode,
  LocalizedText,
  MenuItem,
  Order,
  OrderLine,
  Restaurant,
} from "@babili/shared";
import {
  ingredientTaxonomy,
  pickCatalogTranslation,
  pickLocalizedText,
} from "@babili/shared";
import {
  createOrderDb,
  deleteOrdersByCustomerDb,
  deleteOrdersByRestaurantDb,
  getMenuItemsDb,
  getOrdersDb,
  getRestaurantLanguageDb,
  hasOrderDb,
  initOrderDatabase,
  updateOrderDb,
} from "./db.js";

const restaurants: Pick<Restaurant, "id" | "operatingLanguage">[] = [
  { id: "rst_bistro_01", operatingLanguage: "ru" },
  { id: "rst_sham_02", operatingLanguage: "ar" },
  { id: "rst_istanbul_03", operatingLanguage: "tr" },
];

const ingredients: Array<{
  id: string;
  restaurantId: string;
  name: LocalizedText;
}> = [
  {
    id: "ing_onion",
    restaurantId: "rst_bistro_01",
    name: { en: "Onion", ar: "بصل", ru: "Лук", tr: "Soğan" },
  },
  {
    id: "ing_tomato",
    restaurantId: "rst_bistro_01",
    name: { en: "Tomato", ar: "طماطم", ru: "Помидор", tr: "Domates" },
  },
  {
    id: "ing_garlic",
    restaurantId: "rst_bistro_01",
    name: {
      en: "Garlic sauce",
      ar: "صلصة الثوم",
      ru: "Чесночный соус",
      tr: "Sarımsak sosu",
    },
  },
  {
    id: "ing_lemon",
    restaurantId: "rst_bistro_01",
    name: { en: "Lemon", ar: "ليمون", ru: "Лимон", tr: "Limon" },
  },
];

const menuCatalog: MenuItem[] = [
  {
    id: "mi_salmon_bowl",
    restaurantId: "rst_bistro_01",
    categoryId: "cat_fish",
    ingredientIds: ["ing_onion", "ing_tomato", "ing_lemon"],
    name: {
      en: "Salmon Bowl",
      ar: "وعاء السلمون",
      ru: "Боул с лососем",
      tr: "Somon kasesi",
    },
    description: {},
    price: 18,
    currency: "USD",
    isAvailable: true,
  },
  {
    id: "mi_lentil_soup",
    restaurantId: "rst_bistro_01",
    categoryId: "cat_soups",
    ingredientIds: ["ing_onion", "ing_lemon"],
    name: {
      en: "Lentil Soup",
      ar: "شوربة العدس",
      ru: "Чечевичный суп",
      tr: "Mercimek çorbası",
    },
    description: {},
    price: 7,
    currency: "USD",
    isAvailable: true,
  },
];

const noteTranslations: Record<string, Record<string, string>> = {
  "no onions": {
    ar: "بدون بصل",
    en: "no onions",
    ru: "без лука",
    tr: "soğansız",
  },
  "no onion": {
    ar: "بدون بصل",
    en: "no onion",
    ru: "без лука",
    tr: "soğansız",
  },
  spicy: { ar: "حار", en: "spicy", ru: "острое", tr: "acı" },
  waiter: {
    ar: "طلب نادل",
    en: "waiter request",
    ru: "вызов официанта",
    tr: "garson çağrısı",
  },
};

const orders: Order[] = [
  {
    id: "ord_1001",
    restaurantId: "rst_bistro_01",
    customerId: "usr_customer",
    tableNumber: "5",
    customerLanguage: "ar",
    restaurantLanguage: "ru",
    status: "placed",
    paymentMethod: "cash",
    paymentStatus: "unpaid",
    type: "order",
    lines: [
      {
        menuItemId: "mi_salmon_bowl",
        quantity: 1,
        customerItemName: "وعاء السلمون",
        restaurantItemName: "Боул с лососем",
        customerNote: "بدون بصل",
        restaurantNote: "без лука",
        ingredientNames: [
          { en: "Onion", ar: "بصل", ru: "Лук", tr: "Soğan" },
          { en: "Tomato", ar: "طماطم", ru: "Помидор", tr: "Domates" },
        ],
        removedIngredientIds: ["ing_onion"],
        removedIngredientNames: [
          { en: "Onion", ar: "بصل", ru: "Лук", tr: "Soğan" },
        ],
        customerRemovedIngredients: ["بصل"],
        restaurantRemovedIngredients: ["Лук"],
        kitchenStatus: "pending",
      },
    ],
    total: 18,
    currency: "USD",
    createdAt: new Date().toISOString(),
  },
];

const port = Number(process.env.ORDER_SERVICE_PORT ?? 4103);
const translationServiceUrl =
  process.env.TRANSLATION_SERVICE_URL ?? "http://localhost:4104";
const restaurantServiceUrl =
  process.env.RESTAURANT_SERVICE_URL ?? "http://localhost:4102";
const clients = new Set<express.Response>();
const dbReady = initOrderDatabase().catch((error) => {
  console.error("Order database init failed; using in-memory fallback", error);
});

interface OrderServiceOptions {
  translationServiceUrl?: string;
}

export function createApp(options: OrderServiceOptions = {}) {
  const app = express();
  const translationsUrl =
    options.translationServiceUrl ?? translationServiceUrl;

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ data: { service: "order-service", status: "ok" } });
  });

  app.get("/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    clients.add(res);
    void getLocalizedOrders(req.query).then((snapshot) =>
      sendEvent(res, "snapshot", snapshot),
    );
    req.on("close", () => clients.delete(res));
  });

  app.get("/", async (req, res) => {
    await dbReady;
    res.json({ data: await getLocalizedOrders(req.query) });
  });

  app.delete("/restaurants/:restaurantId", async (req, res) => {
    await dbReady;
    if (hasOrderDb()) {
      await deleteOrdersByRestaurantDb(req.params.restaurantId);
    } else {
      for (let index = orders.length - 1; index >= 0; index -= 1) {
        if (orders[index]?.restaurantId === req.params.restaurantId)
          orders.splice(index, 1);
      }
    }
    await broadcastOrders();
    res.json({ data: { ok: true } });
  });

  app.delete("/customers/:customerId", async (req, res) => {
    await dbReady;
    if (hasOrderDb()) {
      await deleteOrdersByCustomerDb(req.params.customerId);
    } else {
      for (let index = orders.length - 1; index >= 0; index -= 1) {
        if (orders[index]?.customerId === req.params.customerId)
          orders.splice(index, 1);
      }
    }
    await broadcastOrders();
    res.json({ data: { ok: true } });
  });

  app.post("/", async (req, res) => {
    await dbReady;
    const restaurantId = String(req.body.restaurantId ?? "rst_bistro_01");
    const customerLanguage = String(req.body.customerLanguage ?? "en") as
      | LanguageCode
      | string;
    const restaurantLanguage = String(
      req.body.restaurantLanguage ??
        (hasOrderDb()
          ? await getRestaurantLanguageDb(restaurantId)
          : restaurants.find((item) => item.id === restaurantId)
              ?.operatingLanguage) ??
        "en",
    ) as LanguageCode | string;
    const requestedLines = Array.isArray(req.body.lines)
      ? (req.body.lines as OrderLine[])
      : [];

    if (!requestedLines.length) {
      res.status(400).json({ error: "Order must include at least one line" });
      return;
    }

    const lines = await Promise.all(
      requestedLines.map((line) =>
        translateLine(
          restaurantId,
          line,
          customerLanguage,
          restaurantLanguage,
          translationsUrl,
        ),
      ),
    );
    const menuItems = await loadMenuItems(restaurantId);
    const total = lines.reduce((sum, line) => {
      const menuItem = menuItems.find((item) => item.id === line.menuItemId);
      return sum + (menuItem?.price ?? 0) * Number(line.quantity || 0);
    }, 0);

    const order: Order = {
      id: `ord_${Date.now()}`,
      restaurantId,
      customerId: String(req.body.customerId ?? "usr_customer"),
      tableNumber: req.body.tableNumber
        ? String(req.body.tableNumber)
        : undefined,
      customerLanguage,
      restaurantLanguage,
      status: "placed",
      paymentMethod: req.body.paymentMethod === "card" ? "card" : "cash",
      paymentStatus: "unpaid",
      type: lines.some((line) => line.menuItemId === "waiter_request")
        ? "waiter_request"
        : "order",
      lines,
      total,
      currency: "USD",
      createdAt: new Date().toISOString(),
    };

    if (hasOrderDb()) await createOrderDb(order);
    else orders.unshift(order);
    await broadcastOrders();
    res.status(201).json({ data: localizeOrder(order, restaurantLanguage) });
  });

  app.patch("/:orderId/status", async (req, res) => {
    await dbReady;
    const order = await findOrder(req.params.orderId);

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const nextStatus = String(
      req.body.status ?? order.status,
    ) as Order["status"];
    if (
      ![
        "placed",
        "accepted",
        "preparing",
        "ready",
        "completed",
        "cancelled",
      ].includes(nextStatus)
    ) {
      res.status(400).json({ error: "Invalid order status" });
      return;
    }

    order.status = nextStatus;
    if (hasOrderDb()) await updateOrderDb(order);
    await broadcastOrders();
    res.json({ data: localizeOrder(order, order.restaurantLanguage) });
  });

  app.patch("/:orderId/lines/:menuItemId/status", async (req, res) => {
    await dbReady;
    const order = await findOrder(req.params.orderId);
    const line = order?.lines.find(
      (item) => item.menuItemId === req.params.menuItemId,
    );
    const nextStatus = String(
      req.body.kitchenStatus ?? "preparing",
    ) as NonNullable<OrderLine["kitchenStatus"]>;

    if (!order || !line) {
      res.status(404).json({ error: "Order line not found" });
      return;
    }

    if (!["pending", "preparing", "ready"].includes(nextStatus)) {
      res.status(400).json({ error: "Invalid kitchen status" });
      return;
    }

    line.kitchenStatus = nextStatus;
    order.status = order.lines.every((item) => item.kitchenStatus === "ready")
      ? "ready"
      : "preparing";
    if (hasOrderDb()) await updateOrderDb(order);
    await broadcastOrders();
    res.json({ data: localizeOrder(order, order.restaurantLanguage) });
  });

  app.patch("/:orderId/payment", async (req, res) => {
    await dbReady;
    const order = await findOrder(req.params.orderId);

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    order.paymentMethod = req.body.paymentMethod === "card" ? "card" : "cash";
    order.paymentStatus = req.body.paymentStatus === "paid" ? "paid" : "unpaid";
    if (hasOrderDb()) await updateOrderDb(order);
    await broadcastOrders();
    res.json({ data: localizeOrder(order, order.restaurantLanguage) });
  });

  app.patch("/waiter-requests/:orderId/done", async (req, res) => {
    await dbReady;
    const order = await findOrder(req.params.orderId);

    if (!order) {
      res.status(404).json({ error: "Waiter request not found" });
      return;
    }

    if (order.type !== "waiter_request") {
      res.status(404).json({ error: "Waiter request not found" });
      return;
    }
    order.status = "completed";
    if (hasOrderDb()) await updateOrderDb(order);
    await broadcastOrders();
    res.json({ data: localizeOrder(order, order.restaurantLanguage) });
  });

  return app;
}

async function getLocalizedOrders(query: Record<string, unknown>) {
  const restaurantId = query.restaurantId
    ? String(query.restaurantId)
    : undefined;
  const customerId = query.customerId ? String(query.customerId) : undefined;
  const language = query.language ? String(query.language) : undefined;
  const sourceOrders = hasOrderDb()
    ? await getOrdersDb({ restaurantId, customerId })
    : orders;
  return sourceOrders
    .filter((order) => !restaurantId || order.restaurantId === restaurantId)
    .filter((order) => !customerId || order.customerId === customerId)
    .map((order) => localizeOrder(order, language ?? order.restaurantLanguage));
}

async function findOrder(orderId: string) {
  if (hasOrderDb()) {
    return (await getOrdersDb({})).find((item) => item.id === orderId);
  }

  return orders.find((item) => item.id === orderId);
}

async function loadMenuItems(restaurantId: string) {
  if (hasOrderDb()) {
    return getMenuItemsDb(restaurantId);
  }

  if (process.env.BABILI_SKIP_LISTEN && !process.env.RESTAURANT_SERVICE_URL) {
    return menuCatalog.filter((item) => item.restaurantId === restaurantId);
  }

  try {
    const response = await fetch(
      `${restaurantServiceUrl}/${restaurantId}/menu?language=en`,
    );
    const payload = (await response.json()) as { data?: MenuItem[] };
    if (response.ok && Array.isArray(payload.data)) {
      return payload.data;
    }
  } catch {
    return menuCatalog.filter((item) => item.restaurantId === restaurantId);
  }

  return menuCatalog.filter((item) => item.restaurantId === restaurantId);
}

async function translateLine(
  restaurantId: string,
  line: OrderLine,
  customerLanguage: string,
  restaurantLanguage: string,
  translationsUrl: string,
): Promise<OrderLine> {
  const menuItems = await loadMenuItems(restaurantId);
  const menuItem = menuItems.find(
    (item) => item.id === line.menuItemId && item.restaurantId === restaurantId,
  );
  const isWaiterRequest = line.menuItemId === "waiter_request";
  const itemIngredients = ingredientTaxonomy
    .filter((ingredient) => menuItem?.ingredientIds?.includes(ingredient.id))
    .map((ingredient) => ({
      id: ingredient.id,
      restaurantId,
      name: ingredient.translations as LocalizedText,
    }));
  const removedIngredientIds = Array.isArray(line.removedIngredientIds)
    ? line.removedIngredientIds.map(String)
    : [];
  const removedIngredientNames = itemIngredients
    .filter((ingredient) => removedIngredientIds.includes(ingredient.id))
    .map((ingredient) => ingredient.name);

  return {
    ...line,
    quantity: Number(line.quantity || 1),
    customerItemName: isWaiterRequest
      ? await translateText(
          "Waiter request",
          "en",
          customerLanguage,
          translationsUrl,
        )
      : menuItem
        ? pickLocalizedText(menuItem.name, customerLanguage)
        : line.customerItemName,
    restaurantItemName: isWaiterRequest
      ? await translateText(
          "Waiter request",
          "en",
          restaurantLanguage,
          translationsUrl,
        )
      : menuItem
        ? pickLocalizedText(menuItem.name, restaurantLanguage)
        : line.restaurantItemName,
    ingredientNames: itemIngredients.map((ingredient) => ingredient.name),
    removedIngredientIds,
    removedIngredientNames,
    customerRemovedIngredients: removedIngredientNames.map((name) =>
      pickLocalizedText(name, customerLanguage),
    ),
    restaurantRemovedIngredients: removedIngredientNames.map((name) =>
      pickLocalizedText(name, restaurantLanguage),
    ),
    restaurantNote: await translateText(
      line.customerNote,
      customerLanguage,
      restaurantLanguage,
      translationsUrl,
    ),
    kitchenStatus: line.kitchenStatus ?? "pending",
  };
}

async function translateText(
  text: string | undefined,
  sourceLanguage: string,
  targetLanguage: string,
  translationsUrl: string,
) {
  const value = String(text ?? "").trim();

  if (!value) {
    return undefined;
  }

  try {
    const response = await fetch(`${translationsUrl}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: value, sourceLanguage, targetLanguage }),
    });
    const payload = (await response.json()) as {
      data?: { translatedText?: string };
    };

    if (response.ok && payload.data?.translatedText) {
      return payload.data.translatedText;
    }
  } catch {
    return noteTranslations[value.toLowerCase()]?.[targetLanguage] ?? value;
  }

  return noteTranslations[value.toLowerCase()]?.[targetLanguage] ?? value;
}

function localizeOrder(order: Order, language: string) {
  return {
    ...order,
    displayLines: order.lines.map((line) => ({
      ...line,
      displayName:
        language === order.restaurantLanguage
          ? line.restaurantItemName
          : language === order.customerLanguage
            ? line.customerItemName
            : (line.restaurantItemName ?? line.customerItemName),
      displayNote:
        language === order.restaurantLanguage
          ? line.restaurantNote
          : language === order.customerLanguage
            ? line.customerNote
            : (line.restaurantNote ?? line.customerNote),
      displayIngredients: line.ingredientNames?.map((name) =>
        pickLocalizedText(name, language),
      ),
      displayRemovedIngredients: line.removedIngredientNames?.map((name) =>
        pickLocalizedText(name, language),
      ),
    })),
  };
}

function sendEvent(res: express.Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify({ data })}\n\n`);
}

async function broadcastOrders() {
  const snapshot = await getLocalizedOrders({});
  for (const client of clients) {
    sendEvent(client, "orders", snapshot);
  }
}

const app = createApp();

if (!process.env.BABILI_SKIP_LISTEN) {
  app.listen(port, () => {
    console.log(`Order service listening on http://localhost:${port}`);
  });
}
