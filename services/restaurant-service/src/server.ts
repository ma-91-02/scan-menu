import cors from "cors";
import express from "express";
import type { Ingredient, LocalizedText, MenuCategory, MenuItem, Restaurant, SubscriptionPlan } from "@scanmenu/shared";
import { ingredientTaxonomy, menuSectionTaxonomy, pickCatalogTranslation, pickLocalizedText, scanMenuLanguages } from "@scanmenu/shared";
import {
  createCategoryDb,
  createMenuItemDb,
  createRestaurantDb,
  createTableDb,
  deleteCategoryDb,
  deleteMenuItemDb,
  deleteRestaurantDb,
  getCategoriesDb,
  getMenuItemsDb,
  getRestaurantDb,
  getRestaurantsDb,
  getTablesDb,
  hasRestaurantDb,
  initRestaurantDatabase,
  updateCategoryDb,
  updateMenuItemDb,
  updateRestaurantProfileDb,
  type RestaurantRecord,
  type RestaurantTableRecord
} from "./db.js";

interface RestaurantProfile extends Restaurant {
  currency: string;
  ownerFirstName: string;
  ownerLastName: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  city: string;
  selectedPlan: SubscriptionPlan["id"];
}

interface RestaurantTable {
  id: string;
  restaurantId: string;
  number: string;
  qrPath: string;
}

const plans: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic",
    priceMonthly: 0,
    features: ["Testing/demo", "Limited menu items", "Limited tables"],
    limits: { menuItems: 10, tables: 3, branches: 1 }
  },
  {
    id: "standard",
    name: "Standard",
    priceMonthly: 19.99,
    features: ["Small restaurants", "Multilingual menu", "Basic orders"],
    limits: { menuItems: 50, tables: 15, branches: 1 }
  },
  {
    id: "premium",
    name: "Premium",
    priceMonthly: 29.99,
    features: ["Real-time kitchen/cashier", "Staff roles", "More tables"],
    limits: { menuItems: 150, tables: 50, branches: 1 }
  },
  {
    id: "gold",
    name: "Gold",
    priceMonthly: 49.99,
    features: ["Multi-branch", "Advanced monitoring", "Priority features"],
    limits: { menuItems: "unlimited", tables: "unlimited", branches: "unlimited" }
  }
];

const restaurants: RestaurantProfile[] = [
  {
    id: "rst_bistro_01",
    name: "Bistro Aurora",
    operatingLanguage: "ru",
    currency: "RUB",
    supportedCustomerLanguages: ["ar", "en", "ru", "tr"],
    status: "active",
    ownerFirstName: "Anna",
    ownerLastName: "Petrova",
    email: "owner@bistro.local",
    phone: "+7 900 100 20 30",
    address: "Tverskaya 10",
    country: "Russia",
    city: "Moscow",
    selectedPlan: "premium"
  }
];

const categories: MenuCategory[] = [];
const ingredients: Ingredient[] = [];

const menuItems: MenuItem[] = [];

const tables: RestaurantTable[] = [
  { id: "tbl_5", restaurantId: "rst_bistro_01", number: "5", qrPath: "/customer?restaurantId=rst_bistro_01&table=5" },
  { id: "tbl_6", restaurantId: "rst_bistro_01", number: "6", qrPath: "/customer?restaurantId=rst_bistro_01&table=6" }
];

const app = express();
const port = Number(process.env.RESTAURANT_SERVICE_PORT ?? 4102);
const translationServiceUrl = process.env.TRANSLATION_SERVICE_URL ?? "http://localhost:4104";
const dbReady = initRestaurantDatabase().catch((error) => {
  console.error("Restaurant database init failed; using in-memory fallback", error);
});

app.use(cors());
app.use(express.json({ limit: "8mb" }));

app.get("/health", (_req, res) => {
  res.json({ data: { service: "restaurant-service", status: "ok" } });
});

app.get("/", async (_req, res) => {
  await dbReady;
  res.json({ data: hasRestaurantDb() ? await getRestaurantsDb() : restaurants });
});

app.get("/plans", (_req, res) => {
  res.json({ data: plans });
});

app.get("/:restaurantId", async (req, res) => {
  await dbReady;
  const restaurant = await loadOrCreateRestaurant(req.params.restaurantId);
  res.json({ data: restaurant });
});

app.delete("/:restaurantId", async (req, res) => {
  await dbReady;
  if (hasRestaurantDb()) {
    await deleteRestaurantDb(req.params.restaurantId);
  } else {
    const index = restaurants.findIndex((item) => item.id === req.params.restaurantId);
    if (index >= 0) restaurants.splice(index, 1);
    for (let itemIndex = menuItems.length - 1; itemIndex >= 0; itemIndex -= 1) {
      if (menuItems[itemIndex]?.restaurantId === req.params.restaurantId) menuItems.splice(itemIndex, 1);
    }
    for (let categoryIndex = categories.length - 1; categoryIndex >= 0; categoryIndex -= 1) {
      if (categories[categoryIndex]?.restaurantId === req.params.restaurantId) categories.splice(categoryIndex, 1);
    }
    for (let tableIndex = tables.length - 1; tableIndex >= 0; tableIndex -= 1) {
      if (tables[tableIndex]?.restaurantId === req.params.restaurantId) tables.splice(tableIndex, 1);
    }
  }
  res.json({ data: { ok: true } });
});

app.patch("/:restaurantId/profile", async (req, res) => {
  await dbReady;
  const restaurant = await loadOrCreateRestaurant(req.params.restaurantId);

  const patch = {
    ownerFirstName: readString(req.body.ownerFirstName, restaurant.ownerFirstName),
    ownerLastName: readString(req.body.ownerLastName, restaurant.ownerLastName),
    email: readString(req.body.email, restaurant.email).toLowerCase(),
    name: readString(req.body.restaurantName, restaurant.name),
    phone: readString(req.body.phone, restaurant.phone),
    address: readString(req.body.address, restaurant.address),
    country: readString(req.body.country, restaurant.country),
    city: readString(req.body.city, restaurant.city),
    logoUrl: readImageValue(req.body.logoUrl, restaurant.logoUrl),
    currency: normalizeCurrency(req.body.currency ?? restaurant.currency)
  };

  if (hasRestaurantDb()) {
    res.json({ data: await updateRestaurantProfileDb(req.params.restaurantId, patch) });
    return;
  }

  Object.assign(restaurant, patch);
  res.json({ data: restaurant });
});

app.patch(["/:restaurantId/plan", "/:restaurantId/subscription"], async (req, res) => {
  await dbReady;
  const restaurantId = String(req.params.restaurantId);
  const restaurant = await loadOrCreateRestaurant(restaurantId);
  const requestedPlan = String(req.body.planId ?? req.body.plan ?? "");
  const plan = plans.find((item) => item.id === requestedPlan);

  if (!plan) {
    res.status(404).json({ error: "Restaurant or plan not found" });
    return;
  }

  const updatedRestaurant = hasRestaurantDb()
    ? await updateRestaurantProfileDb(restaurantId, { selectedPlan: plan.id })
    : Object.assign(restaurant, { selectedPlan: plan.id });
  res.json({ data: { restaurant: updatedRestaurant, plan } });
});

app.patch("/:restaurantId/language", async (req, res) => {
  await dbReady;
  const restaurant = await loadOrCreateRestaurant(req.params.restaurantId);

  const operatingLanguage = String(req.body.operatingLanguage ?? restaurant.operatingLanguage);
  const updatedRestaurant = hasRestaurantDb()
    ? await updateRestaurantProfileDb(req.params.restaurantId, { operatingLanguage })
    : Object.assign(restaurant, { operatingLanguage });
  res.json({ data: updatedRestaurant });
});

app.get("/:restaurantId/catalog/categories", async (req, res) => {
  await dbReady;
  const entries = hasRestaurantDb() ? await getCategoriesDb(req.params.restaurantId) : categories;
  res.json({ data: localizeEntries(entries, req.params.restaurantId, String(req.query.language ?? "en"), String(req.query.q ?? "")) });
});

app.post("/:restaurantId/catalog/categories", async (req, res) => {
  await dbReady;
  await loadOrCreateRestaurant(req.params.restaurantId);
  const entries = hasRestaurantDb() ? await getCategoriesDb(req.params.restaurantId) : categories;
  const catalogKey = readCatalogKey(req.body.catalogKey);
  const language = String(req.body.language ?? "en");
  const name = catalogKey ? getSectionDisplayName(catalogKey, language) : req.body.name;
  const existing = catalogKey
    ? entries.find((item) => item.restaurantId === req.params.restaurantId && item.catalogKey === catalogKey)
    : undefined;

  if (existing) {
    res.status(200).json({ data: localizeEntry(existing, language) });
    return;
  }

  const entry = await createLocalizedEntry<MenuCategory>(req.params.restaurantId, "cat", name, language, catalogKey);
  if (hasRestaurantDb()) {
    await createCategoryDb(entry);
  } else {
    categories.push(entry);
  }
  res.status(201).json({ data: localizeEntry(entry, language) });
});

app.patch("/:restaurantId/catalog/categories/:categoryId", async (req, res) => {
  await dbReady;
  const entries = hasRestaurantDb() ? await getCategoriesDb(req.params.restaurantId) : categories;
  const entry = entries.find((item) => item.id === req.params.categoryId && item.restaurantId === req.params.restaurantId);
  if (!entry) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  const language = String(req.body.language ?? "en");
  const catalogKey = readCatalogKey(req.body.catalogKey);
  entry.catalogKey = catalogKey;
  entry.name = catalogKey
    ? getSectionTranslations(catalogKey)
    : await buildLocalizedText(String(req.body.name ?? pickLocalizedText(entry.name, language)), language);
  if (hasRestaurantDb()) {
    await updateCategoryDb(entry);
  }
  res.json({ data: localizeEntry(entry, language) });
});

app.delete("/:restaurantId/catalog/categories/:categoryId", async (req, res) => {
  await dbReady;
  if (hasRestaurantDb()) {
    await deleteCategoryDb(req.params.restaurantId, req.params.categoryId);
  } else {
    const index = categories.findIndex((item) => item.id === req.params.categoryId && item.restaurantId === req.params.restaurantId);
    if (index >= 0) {
      categories.splice(index, 1);
    }
  }
  res.json({ data: { ok: true } });
});

app.get("/:restaurantId/catalog/ingredients", (req, res) => {
  res.json({ data: localizeEntries(ingredients, req.params.restaurantId, String(req.query.language ?? "en"), String(req.query.q ?? "")) });
});

app.post("/:restaurantId/catalog/ingredients", async (req, res) => {
  const entry = await createLocalizedEntry<Ingredient>(req.params.restaurantId, "ing", req.body.name, req.body.language);
  ingredients.push(entry);
  res.status(201).json({ data: localizeEntry(entry, String(req.body.language ?? "en")) });
});

app.patch("/:restaurantId/catalog/ingredients/:ingredientId", async (req, res) => {
  const entry = ingredients.find((item) => item.id === req.params.ingredientId && item.restaurantId === req.params.restaurantId);
  if (!entry) {
    res.status(404).json({ error: "Ingredient not found" });
    return;
  }

  entry.name = await buildLocalizedText(String(req.body.name ?? pickLocalizedText(entry.name, String(req.body.language ?? "en"))), String(req.body.language ?? "en"));
  res.json({ data: localizeEntry(entry, String(req.body.language ?? "en")) });
});

app.delete("/:restaurantId/catalog/ingredients/:ingredientId", (req, res) => {
  const index = ingredients.findIndex((item) => item.id === req.params.ingredientId && item.restaurantId === req.params.restaurantId);
  if (index >= 0) {
    ingredients.splice(index, 1);
  }
  res.json({ data: { ok: true } });
});

app.get("/:restaurantId/menu", async (req, res) => {
  await dbReady;
  res.json({ data: await getLocalizedMenu(req.params.restaurantId, String(req.query.language ?? "en")) });
});

app.post("/:restaurantId/menu", async (req, res) => {
  await dbReady;
  const restaurant = await loadOrCreateRestaurant(req.params.restaurantId);

  const language = String(req.body.language ?? restaurant.operatingLanguage);
  const name = String(req.body.name ?? "").trim();
  const price = Number(req.body.price ?? 0);

  if (!name || price < 0) {
    res.status(400).json({ error: "Valid menu item name and price are required" });
    return;
  }

  const item: MenuItem = {
    id: `mi_${Date.now()}`,
    restaurantId: restaurant.id,
    categoryId: String(req.body.categoryId ?? ""),
    ingredientIds: Array.isArray(req.body.ingredientIds) ? req.body.ingredientIds.map(String) : [],
    name: await buildLocalizedText(name, language),
    description: await buildLocalizedText(String(req.body.description ?? ""), language),
    price,
    currency: normalizeCurrency(req.body.currency ?? restaurant.currency),
    isAvailable: true
  };

  if (req.body.imageUrl) {
    (item as MenuItem & { imageUrl?: string }).imageUrl = String(req.body.imageUrl);
  }

  if (hasRestaurantDb()) {
    await createMenuItemDb(item);
  } else {
    menuItems.push(item);
  }
  res.status(201).json({ data: localizeMenuItem(item, language) });
});

app.patch("/:restaurantId/menu/:menuItemId", async (req, res) => {
  await dbReady;
  const items = hasRestaurantDb() ? await getMenuItemsDb(req.params.restaurantId) : menuItems;
  const item = items.find((entry) => entry.id === req.params.menuItemId && entry.restaurantId === req.params.restaurantId);
  if (!item) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }

  const language = String(req.body.language ?? "en");
  if (req.body.name) item.name = await buildLocalizedText(String(req.body.name), language);
  if (req.body.description) item.description = await buildLocalizedText(String(req.body.description), language);
  if (req.body.categoryId !== undefined) item.categoryId = String(req.body.categoryId);
  if (Array.isArray(req.body.ingredientIds)) item.ingredientIds = req.body.ingredientIds.map(String);
  if (req.body.price !== undefined) item.price = Number(req.body.price);
  if (req.body.currency !== undefined) item.currency = normalizeCurrency(req.body.currency);
  if (req.body.isAvailable !== undefined) item.isAvailable = Boolean(req.body.isAvailable);
  if (req.body.imageUrl !== undefined) item.imageUrl = String(req.body.imageUrl);
  if (hasRestaurantDb()) {
    await updateMenuItemDb(item);
  }

  res.json({ data: localizeMenuItem(item, language) });
});

app.delete("/:restaurantId/menu/:menuItemId", async (req, res) => {
  await dbReady;
  if (hasRestaurantDb()) {
    await deleteMenuItemDb(req.params.restaurantId, req.params.menuItemId);
  } else {
    const index = menuItems.findIndex((entry) => entry.id === req.params.menuItemId && entry.restaurantId === req.params.restaurantId);
    if (index >= 0) {
      menuItems.splice(index, 1);
    }
  }
  res.json({ data: { ok: true } });
});

app.get("/:restaurantId/tables", async (req, res) => {
  await dbReady;
  res.json({ data: hasRestaurantDb() ? await getTablesDb(req.params.restaurantId) : tables.filter((table) => table.restaurantId === req.params.restaurantId) });
});

app.post("/:restaurantId/tables", async (req, res) => {
  await dbReady;
  const number = String(req.body.number ?? req.body.tableNumber ?? "").trim();
  if (!number) {
    res.status(400).json({ error: "Table number is required" });
    return;
  }

  const table: RestaurantTableRecord = {
    id: `tbl_${Date.now()}`,
    restaurantId: req.params.restaurantId,
    number,
    qrPath: `/customer?restaurantId=${encodeURIComponent(req.params.restaurantId)}&table=${encodeURIComponent(number)}`
  };
  const savedTable = hasRestaurantDb() ? await createTableDb(table) : table;
  if (!hasRestaurantDb()) tables.push(savedTable);
  res.status(201).json({ data: { ...savedTable, tableNumber: savedTable.number, qrCode: savedTable.qrPath } });
});

function findRestaurant(id: string) {
  return restaurants.find((item) => item.id === id);
}

async function loadRestaurant(id: string): Promise<RestaurantRecord | RestaurantProfile | undefined> {
  return hasRestaurantDb() ? getRestaurantDb(id) : findRestaurant(id);
}

async function loadOrCreateRestaurant(id: string): Promise<RestaurantRecord | RestaurantProfile> {
  const existing = await loadRestaurant(id);
  if (existing) return existing;

  const restaurant = createDefaultRestaurant(id);
  if (hasRestaurantDb()) {
    return createRestaurantDb(restaurant);
  }

  restaurants.push(restaurant);
  return restaurant;
}

function createDefaultRestaurant(id: string): RestaurantProfile {
  return {
    id,
    name: "New restaurant",
    operatingLanguage: "en",
    currency: "USD",
    supportedCustomerLanguages: scanMenuLanguages.map((language) => language.code),
    status: "active",
    ownerFirstName: "",
    ownerLastName: "",
    email: "",
    phone: "",
    address: "",
    country: "",
    city: "",
    selectedPlan: "basic"
  };
}

function readString(value: unknown, fallback: string) {
  const nextValue = String(value ?? "").trim();
  return nextValue || fallback;
}

function readImageValue(value: unknown, fallback?: string) {
  if (value === undefined) return fallback;
  const nextValue = String(value ?? "").trim();
  if (!nextValue) return undefined;
  if (nextValue.startsWith("data:image/") || nextValue.startsWith("https://") || nextValue.startsWith("http://")) {
    return nextValue;
  }
  return fallback;
}

function normalizeCurrency(value: unknown) {
  const code = String(value ?? "USD").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : "USD";
}

function localizeEntries<T extends MenuCategory | Ingredient>(entries: T[], restaurantId: string, language: string, query: string) {
  const value = query.trim().toLowerCase();
  return entries
    .filter((entry) => entry.restaurantId === restaurantId)
    .map((entry) => localizeEntry(entry, language))
    .filter((entry) => !value || Object.values(entry.name).some((name) => String(name).toLowerCase().includes(value)));
}

function localizeEntry<T extends MenuCategory | Ingredient>(entry: T, language: string) {
  if ("catalogKey" in entry && entry.catalogKey) {
    const translations = getSectionTranslations(entry.catalogKey);
    if (Object.keys(translations).length) {
      return {
        ...entry,
        name: translations,
        displayName: pickLocalizedText(translations, language)
      };
    }
  }

  return {
    ...entry,
    displayName: pickLocalizedText(entry.name, language)
  };
}

async function createLocalizedEntry<T extends MenuCategory | Ingredient>(restaurantId: string, prefix: string, name: unknown, language: unknown, catalogKey?: string): Promise<T> {
  const ownerLanguage = String(language ?? "en");
  const text = String(name ?? "").trim();

  if (!text) {
    throw new Error("Name is required");
  }

  return {
    id: `${prefix}_${Date.now()}`,
    restaurantId,
    ...(catalogKey ? { catalogKey } : {}),
    name: catalogKey ? getSectionTranslations(catalogKey) : await buildLocalizedText(text, ownerLanguage)
  } as T;
}

function readCatalogKey(value: unknown) {
  const key = String(value ?? "").trim();
  return menuSectionTaxonomy.some((section) => section.id === key) ? key : undefined;
}

function getSectionTranslations(catalogKey: string): LocalizedText {
  return menuSectionTaxonomy.find((section) => section.id === catalogKey)?.translations ?? {};
}

function getSectionDisplayName(catalogKey: string, language: string) {
  const translations = getSectionTranslations(catalogKey);
  return pickLocalizedText(translations, language) || catalogKey;
}

async function getLocalizedMenu(restaurantId: string, language: string) {
  const items = hasRestaurantDb() ? await getMenuItemsDb(restaurantId) : menuItems;
  return items
    .filter((item) => item.restaurantId === restaurantId && item.isAvailable)
    .map((item) => localizeMenuItem(item, language));
}

function localizeMenuItem(item: MenuItem, language: string) {
  const itemIngredients = ingredientTaxonomy.filter((ingredient) => item.ingredientIds?.includes(ingredient.id));
  return {
    ...item,
    displayName: pickLocalizedText(item.name, language),
    displayDescription: pickLocalizedText(item.description, language),
    ingredients: itemIngredients.map((ingredient) => ({
      id: ingredient.id,
      restaurantId: item.restaurantId,
      name: ingredient.translations,
      displayName: pickCatalogTranslation(ingredient.translations, language)
    }))
  };
}

async function buildLocalizedText(text: string, sourceLanguage: string): Promise<LocalizedText> {
  const value = text.trim();
  const localized: LocalizedText = { [sourceLanguage]: value };
  const targetLanguages = scanMenuLanguages.map((language) => language.code).filter((language) => language !== sourceLanguage);

  await Promise.all(
    targetLanguages.map(async (targetLanguage) => {
      localized[targetLanguage] = await translateText(value, sourceLanguage, targetLanguage);
    })
  );

  return localized;
}

async function translateText(text: string, sourceLanguage: string, targetLanguage: string) {
  if (!text) {
    return "";
  }

  try {
    const response = await fetch(`${translationServiceUrl}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, sourceLanguage, targetLanguage })
    });
    const payload = (await response.json()) as { data?: { translatedText?: string } };
    return response.ok && payload.data?.translatedText ? payload.data.translatedText : text;
  } catch {
    return text;
  }
}

app.listen(port, () => {
  console.log(`Restaurant service listening on http://localhost:${port}`);
});
