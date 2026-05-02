import cors from "cors";
import express from "express";
import type { LanguageCode, MenuItem, Order, OrderLine, Restaurant } from "@menuza/shared";
import { pickLocalizedText } from "@menuza/shared";

const restaurants: Pick<Restaurant, "id" | "operatingLanguage">[] = [
  { id: "rst_bistro_01", operatingLanguage: "ru" },
  { id: "rst_sham_02", operatingLanguage: "ar" },
  { id: "rst_istanbul_03", operatingLanguage: "tr" }
];

const menuCatalog: MenuItem[] = [
  {
    id: "mi_salmon_bowl",
    restaurantId: "rst_bistro_01",
    name: { en: "Salmon Bowl", ar: "وعاء السلمون", ru: "Боул с лососем", tr: "Somon kasesi" },
    description: {},
    price: 18,
    currency: "USD",
    isAvailable: true
  },
  {
    id: "mi_lentil_soup",
    restaurantId: "rst_bistro_01",
    name: { en: "Lentil Soup", ar: "شوربة العدس", ru: "Чечевичный суп", tr: "Mercimek çorbası" },
    description: {},
    price: 7,
    currency: "USD",
    isAvailable: true
  },
  {
    id: "mi_kebab_plate",
    restaurantId: "rst_sham_02",
    name: { en: "Kebab Plate", ar: "طبق كباب", ru: "Кебаб тарелка", tr: "Kebap tabağı" },
    description: {},
    price: 16,
    currency: "USD",
    isAvailable: true
  },
  {
    id: "mi_fattoush",
    restaurantId: "rst_sham_02",
    name: { en: "Fattoush", ar: "فتوش", ru: "Фаттуш", tr: "Fattuş" },
    description: {},
    price: 6,
    currency: "USD",
    isAvailable: true
  },
  {
    id: "mi_adana_wrap",
    restaurantId: "rst_istanbul_03",
    name: { en: "Adana Wrap", ar: "راب أضنة", ru: "Адана ролл", tr: "Adana dürüm" },
    description: {},
    price: 12,
    currency: "USD",
    isAvailable: true
  },
  {
    id: "mi_ayran",
    restaurantId: "rst_istanbul_03",
    name: { en: "Ayran", ar: "عيران", ru: "Айран", tr: "Ayran" },
    description: {},
    price: 3,
    currency: "USD",
    isAvailable: true
  }
];

const noteTranslations: Record<string, Record<string, string>> = {
  "no onions": { ar: "بدون بصل", en: "no onions", ru: "без лука", tr: "soğansız" },
  spicy: { ar: "حار", en: "spicy", ru: "острое", tr: "acı" },
  "extra sauce": { ar: "صلصة إضافية", en: "extra sauce", ru: "дополнительный соус", tr: "ekstra sos" }
};

const orders: Order[] = [
  {
    id: "ord_1001",
    restaurantId: "rst_bistro_01",
    customerId: "usr_customer",
    customerLanguage: "ar",
    restaurantLanguage: "ru",
    status: "placed",
    lines: [
      {
        menuItemId: "mi_salmon_bowl",
        quantity: 1,
        customerItemName: "وعاء السلمون",
        restaurantItemName: "Боул с лососем",
        customerNote: "بدون بصل",
        restaurantNote: "без лука"
      }
    ],
    total: 18,
    currency: "USD",
    createdAt: new Date().toISOString()
  }
];

const app = express();
const port = Number(process.env.ORDER_SERVICE_PORT ?? 4103);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ data: { service: "order-service", status: "ok" } });
});

app.get("/", (req, res) => {
  const restaurantId = req.query.restaurantId ? String(req.query.restaurantId) : undefined;
  const language = req.query.language ? String(req.query.language) : undefined;
  const data = orders
    .filter((order) => !restaurantId || order.restaurantId === restaurantId)
    .map((order) => localizeOrder(order, language ?? order.restaurantLanguage));

  res.json({ data });
});

app.post("/", (req, res) => {
  const restaurantId = String(req.body.restaurantId ?? "rst_bistro_01");
  const customerLanguage = String(req.body.customerLanguage ?? "en") as LanguageCode | string;
  const restaurantLanguage =
    String(req.body.restaurantLanguage ?? restaurants.find((item) => item.id === restaurantId)?.operatingLanguage ?? "en") as
      | LanguageCode
      | string;
  const requestedLines = (req.body.lines ?? []) as OrderLine[];
  const lines = requestedLines.map((line) => translateLine(restaurantId, line, customerLanguage, restaurantLanguage));
  const total = lines.reduce((sum, line) => {
    const menuItem = menuCatalog.find((item) => item.id === line.menuItemId);
    return sum + (menuItem?.price ?? 0) * line.quantity;
  }, 0);

  const order: Order = {
    id: `ord_${Date.now()}`,
    restaurantId,
    customerId: String(req.body.customerId ?? "usr_customer"),
    customerLanguage,
    restaurantLanguage,
    status: "placed",
    lines,
    total,
    currency: "USD",
    createdAt: new Date().toISOString()
  };

  orders.unshift(order);
  res.status(201).json({ data: localizeOrder(order, restaurantLanguage) });
});

app.patch("/:orderId/status", (req, res) => {
  const order = orders.find((item) => item.id === req.params.orderId);

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  order.status = req.body.status ?? order.status;
  res.json({ data: order });
});

function translateLine(
  restaurantId: string,
  line: OrderLine,
  customerLanguage: string,
  restaurantLanguage: string
): OrderLine {
  const menuItem = menuCatalog.find((item) => item.id === line.menuItemId && item.restaurantId === restaurantId);
  const noteKey = String(line.customerNote ?? "").trim().toLowerCase();

  return {
    ...line,
    customerItemName: menuItem ? pickLocalizedText(menuItem.name, customerLanguage) : line.customerItemName,
    restaurantItemName: menuItem ? pickLocalizedText(menuItem.name, restaurantLanguage) : line.restaurantItemName,
    restaurantNote: noteTranslations[noteKey]?.[restaurantLanguage] ?? line.restaurantNote ?? line.customerNote
  };
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
            : line.restaurantItemName ?? line.customerItemName,
      displayNote:
        language === order.restaurantLanguage
          ? line.restaurantNote
          : language === order.customerLanguage
            ? line.customerNote
            : line.restaurantNote ?? line.customerNote
    }))
  };
}

app.listen(port, () => {
  console.log(`Order service listening on http://localhost:${port}`);
});
