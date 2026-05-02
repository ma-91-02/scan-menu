import cors from "cors";
import express from "express";
import type { MenuItem, Restaurant } from "@menuza/shared";
import { pickLocalizedText } from "@menuza/shared";

const restaurants: Restaurant[] = [
  {
    id: "rst_bistro_01",
    name: "Bistro Aurora",
    operatingLanguage: "ru",
    supportedCustomerLanguages: ["ar", "en", "ru", "tr"],
    status: "active"
  },
  {
    id: "rst_sham_02",
    name: "Sham Garden",
    operatingLanguage: "ar",
    supportedCustomerLanguages: ["ar", "en", "ru", "tr"],
    status: "active"
  },
  {
    id: "rst_istanbul_03",
    name: "Istanbul Grill",
    operatingLanguage: "tr",
    supportedCustomerLanguages: ["ar", "en", "ru", "tr"],
    status: "active"
  }
];

const menuItems: MenuItem[] = [
  {
    id: "mi_salmon_bowl",
    restaurantId: "rst_bistro_01",
    name: { en: "Salmon Bowl", ar: "وعاء السلمون", ru: "Боул с лососем", tr: "Somon kasesi" },
    description: {
      en: "Rice, salmon, avocado, cucumber, sesame.",
      ar: "أرز، سلمون، أفوكادو، خيار، سمسم.",
      ru: "Рис, лосось, авокадо, огурец, кунжут.",
      tr: "Pirinç, somon, avokado, salatalık, susam."
    },
    price: 18,
    currency: "USD",
    isAvailable: true
  },
  {
    id: "mi_lentil_soup",
    restaurantId: "rst_bistro_01",
    name: { en: "Lentil Soup", ar: "شوربة العدس", ru: "Чечевичный суп", tr: "Mercimek çorbası" },
    description: {
      en: "Warm lentil soup with lemon and herbs.",
      ar: "شوربة عدس دافئة مع الليمون والأعشاب.",
      ru: "Теплый чечевичный суп с лимоном и зеленью.",
      tr: "Limon ve otlarla sıcak mercimek çorbası."
    },
    price: 7,
    currency: "USD",
    isAvailable: true
  },
  {
    id: "mi_kebab_plate",
    restaurantId: "rst_sham_02",
    name: { en: "Kebab Plate", ar: "طبق كباب", ru: "Кебаб тарелка", tr: "Kebap tabağı" },
    description: {
      en: "Grilled kebab, rice, salad, and garlic sauce.",
      ar: "كباب مشوي، أرز، سلطة، وصلصة ثوم.",
      ru: "Кебаб на гриле, рис, салат и чесночный соус.",
      tr: "Izgara kebap, pilav, salata ve sarımsak sosu."
    },
    price: 16,
    currency: "USD",
    isAvailable: true
  },
  {
    id: "mi_fattoush",
    restaurantId: "rst_sham_02",
    name: { en: "Fattoush", ar: "فتوش", ru: "Фаттуш", tr: "Fattuş" },
    description: {
      en: "Fresh vegetables, toasted bread, sumac dressing.",
      ar: "خضار طازجة، خبز محمص، وصلصة سماق.",
      ru: "Свежие овощи, поджаренный хлеб, соус с сумахом.",
      tr: "Taze sebze, kızarmış ekmek, sumak sosu."
    },
    price: 6,
    currency: "USD",
    isAvailable: true
  },
  {
    id: "mi_adana_wrap",
    restaurantId: "rst_istanbul_03",
    name: { en: "Adana Wrap", ar: "راب أضنة", ru: "Адана ролл", tr: "Adana dürüm" },
    description: {
      en: "Spiced minced meat wrap with herbs and tomato.",
      ar: "راب لحم متبل مع أعشاب وطماطم.",
      ru: "Ролл с пряным фаршем, зеленью и томатом.",
      tr: "Baharatlı kıyma, yeşillik ve domatesli dürüm."
    },
    price: 12,
    currency: "USD",
    isAvailable: true
  },
  {
    id: "mi_ayran",
    restaurantId: "rst_istanbul_03",
    name: { en: "Ayran", ar: "عيران", ru: "Айран", tr: "Ayran" },
    description: {
      en: "Cold yogurt drink.",
      ar: "مشروب لبن بارد.",
      ru: "Холодный йогуртовый напиток.",
      tr: "Soğuk yoğurt içeceği."
    },
    price: 3,
    currency: "USD",
    isAvailable: true
  }
];

const catalogCategories = [
  {
    id: "cat_meat",
    name: { en: "Meat", ar: "اللحوم", ru: "Мясо", tr: "Et" }
  },
  {
    id: "cat_chicken",
    name: { en: "Chicken", ar: "الدجاج", ru: "Курица", tr: "Tavuk" }
  },
  {
    id: "cat_drinks",
    name: { en: "Cold Drinks", ar: "المشروبات الباردة", ru: "Холодные напитки", tr: "Soğuk içecekler" }
  },
  {
    id: "cat_salads",
    name: { en: "Salads", ar: "السلطات", ru: "Салаты", tr: "Salatalar" }
  },
  {
    id: "cat_fish",
    name: { en: "Fish", ar: "الأسماك", ru: "Рыба", tr: "Balık" }
  }
];

const catalogIngredients = [
  { id: "ing_onion", name: { en: "Onion", ar: "بصل", ru: "Лук", tr: "Soğan" } },
  { id: "ing_tomato", name: { en: "Tomato", ar: "طماطم", ru: "Помидор", tr: "Domates" } },
  { id: "ing_garlic", name: { en: "Garlic sauce", ar: "صلصة الثوم", ru: "Чесночный соус", tr: "Sarımsak sosu" } },
  { id: "ing_cheese", name: { en: "Cheese", ar: "جبن", ru: "Сыр", tr: "Peynir" } },
  { id: "ing_spicy", name: { en: "Spicy sauce", ar: "صلصة حارة", ru: "Острый соус", tr: "Acı sos" } },
  { id: "ing_lemon", name: { en: "Lemon", ar: "ليمون", ru: "Лимон", tr: "Limon" } }
];

const app = express();
const port = Number(process.env.RESTAURANT_SERVICE_PORT ?? 4102);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ data: { service: "restaurant-service", status: "ok" } });
});

app.get("/", (_req, res) => {
  res.json({ data: restaurants });
});

app.get("/catalog/categories", (req, res) => {
  const language = String(req.query.language ?? "en");
  const query = String(req.query.q ?? "").trim().toLowerCase();
  const data = catalogCategories
    .map((category) => ({
      ...category,
      displayName: pickLocalizedText(category.name, language)
    }))
    .filter((category) => !query || Object.values(category.name).some((value) => value.toLowerCase().includes(query)));

  res.json({ data });
});

app.get("/catalog/ingredients", (req, res) => {
  const language = String(req.query.language ?? "en");
  const query = String(req.query.q ?? "").trim().toLowerCase();
  const data = catalogIngredients
    .map((ingredient) => ({
      ...ingredient,
      displayName: pickLocalizedText(ingredient.name, language)
    }))
    .filter((ingredient) => !query || Object.values(ingredient.name).some((value) => value.toLowerCase().includes(query)));

  res.json({ data });
});

app.get("/:restaurantId", (req, res) => {
  const restaurant = restaurants.find((item) => item.id === req.params.restaurantId);

  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }

  res.json({ data: restaurant });
});

app.patch("/:restaurantId/language", (req, res) => {
  const restaurant = restaurants.find((item) => item.id === req.params.restaurantId);

  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }

  restaurant.operatingLanguage = String(req.body.operatingLanguage ?? restaurant.operatingLanguage);
  res.json({ data: restaurant });
});

app.get("/:restaurantId/menu", (req, res) => {
  const language = String(req.query.language ?? "en");
  const restaurantMenu = menuItems
    .filter((item) => item.restaurantId === req.params.restaurantId && item.isAvailable)
    .map((item) => ({
      ...item,
      displayName: pickLocalizedText(item.name, language),
      displayDescription: pickLocalizedText(item.description, language)
    }));

  res.json({ data: restaurantMenu });
});

app.post("/:restaurantId/menu", (req, res) => {
  const restaurant = restaurants.find((item) => item.id === req.params.restaurantId);

  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }

  const language = String(req.body.language ?? restaurant.operatingLanguage);
  const name = String(req.body.name ?? "").trim();
  const price = Number(req.body.price ?? 0);

  if (!name) {
    res.status(400).json({ error: "Menu item name is required" });
    return;
  }

  const item: MenuItem = {
    id: `mi_${Date.now()}`,
    restaurantId: restaurant.id,
    categoryId: String(req.body.categoryId ?? ""),
    ingredientIds: Array.isArray(req.body.ingredientIds) ? req.body.ingredientIds.map(String) : [],
    name: { [language]: name, en: name },
    description: {},
    price,
    currency: "USD",
    isAvailable: true
  };

  menuItems.push(item);

  res.status(201).json({
    data: {
      ...item,
      displayName: pickLocalizedText(item.name, language),
      displayDescription: ""
    }
  });
});

app.listen(port, () => {
  console.log(`Restaurant service listening on http://localhost:${port}`);
});
