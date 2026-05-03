"use client";

import { useEffect, useMemo, useState } from "react";
import { supportedLanguages } from "@scan-menu/shared";
import { SessionBar } from "../session-actions";

type TabId = "menu" | "cashier" | "kitchen";

interface CatalogEntry {
  id: string;
  name: Record<string, string>;
  displayName: string;
}

interface OwnerMenuItem {
  id: string;
  category: string;
  name: string;
  translatedName: string;
  ingredients: string[];
  price: number;
  available: boolean;
}

interface RestaurantOrder {
  id: string;
  status: string;
  total: number;
  currency: string;
  displayLines?: Array<{
    menuItemId: string;
    quantity: number;
    displayName?: string;
    displayNote?: string;
  }>;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";
const ownerRestaurantId = "rst_bistro_01";
const fallbackRestaurantName = "Bistro Aurora";

const copy = {
  ar: {
    title: "لوحة صاحب المطعم",
    menu: "المنيو",
    cashier: "الكاشير",
    kitchen: "المطبخ",
    language: "لغة صاحب المطعم",
    restaurant: "مطعمك",
    activeOrders: "طلبات نشطة",
    menuHint: "إضافة الأقسام والأصناف من كتالوج موحّد حتى تبقى الترجمة ثابتة للجميع.",
    sectionSearch: "بحث عن قسم موحّد",
    mealName: "اسم الوجبة بلغتك",
    price: "السعر",
    ingredients: "المكونات كخيارات",
    addMeal: "إضافة وجبة",
    items: "الوجبات",
    category: "القسم",
    customerName: "اسم العميل",
    ownerName: "اسم المطعم",
    status: "الحالة",
    available: "متاح",
    hidden: "مخفي",
    waiter: "نداء النادل",
    reservations: "الحجوزات",
    start: "بدء التحضير",
    ready: "الطلب جاهز",
    back: "العودة للواجهة"
  },
  en: {
    title: "Restaurant owner dashboard",
    menu: "Menu",
    cashier: "Cashier",
    kitchen: "Kitchen",
    language: "Owner language",
    restaurant: "Your restaurant",
    activeOrders: "Active orders",
    menuHint: "Add sections and meals from one shared catalog so translation stays consistent.",
    sectionSearch: "Search shared section",
    mealName: "Meal name in your language",
    price: "Price",
    ingredients: "Ingredient options",
    addMeal: "Add meal",
    items: "Meals",
    category: "Section",
    customerName: "Customer name",
    ownerName: "Restaurant name",
    status: "Status",
    available: "Available",
    hidden: "Hidden",
    waiter: "Waiter calls",
    reservations: "Reservations",
    start: "Start preparing",
    ready: "Order ready",
    back: "Back to public site"
  },
  ru: {
    title: "Панель владельца ресторана",
    menu: "Меню",
    cashier: "Касса",
    kitchen: "Кухня",
    language: "Язык владельца",
    restaurant: "Ваш ресторан",
    activeOrders: "Активные заказы",
    menuHint: "Добавляйте разделы и блюда из общего каталога, чтобы переводы были едиными.",
    sectionSearch: "Поиск раздела",
    mealName: "Название блюда на вашем языке",
    price: "Цена",
    ingredients: "Ингредиенты",
    addMeal: "Добавить блюдо",
    items: "Блюда",
    category: "Раздел",
    customerName: "Название клиента",
    ownerName: "Название ресторана",
    status: "Статус",
    available: "Доступно",
    hidden: "Скрыто",
    waiter: "Вызов официанта",
    reservations: "Брони",
    start: "Начать готовить",
    ready: "Заказ готов",
    back: "Назад на сайт"
  },
  tr: {
    title: "Restoran sahibi paneli",
    menu: "Menü",
    cashier: "Kasiyer",
    kitchen: "Mutfak",
    language: "Sahip dili",
    restaurant: "Restoranınız",
    activeOrders: "Aktif siparişler",
    menuHint: "Çeviriler tutarlı kalsın diye bölümleri ve yemekleri ortak katalogdan ekleyin.",
    sectionSearch: "Bölüm ara",
    mealName: "Yemek adı",
    price: "Fiyat",
    ingredients: "Malzemeler",
    addMeal: "Yemek ekle",
    items: "Yemekler",
    category: "Bölüm",
    customerName: "Müşteri adı",
    ownerName: "Restoran adı",
    status: "Durum",
    available: "Aktif",
    hidden: "Gizli",
    waiter: "Garson çağrıları",
    reservations: "Rezervasyonlar",
    start: "Hazırlamaya başla",
    ready: "Sipariş hazır",
    back: "Siteye dön"
  }
};

const initialMenu: OwnerMenuItem[] = [
  {
    id: "mi-1",
    category: "Salads",
    name: "Greek Salad",
    translatedName: "Греческий салат",
    ingredients: ["Tomato", "Onion", "Cheese"],
    price: 8,
    available: true
  },
  {
    id: "mi-2",
    category: "Cold Drinks",
    name: "Orange Juice",
    translatedName: "Апельсиновый сок",
    ingredients: ["Lemon"],
    price: 5,
    available: true
  }
];

export default function RestaurantDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("menu");
  const [restaurantName, setRestaurantName] = useState(fallbackRestaurantName);
  const [ownerLanguage, setOwnerLanguage] = useState("ru");
  const [restaurantOrders, setRestaurantOrders] = useState<RestaurantOrder[]>([]);
  const [categories, setCategories] = useState<CatalogEntry[]>([]);
  const [ingredients, setIngredients] = useState<CatalogEntry[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("cat_salads");
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>(["ing_tomato"]);
  const [mealName, setMealName] = useState("");
  const [mealPrice, setMealPrice] = useState("0");
  const [menuItems, setMenuItems] = useState(initialMenu);

  const t = copy[ownerLanguage as keyof typeof copy] ?? copy.en;
  const tabs = [
    { id: "menu" as const, label: t.menu },
    { id: "cashier" as const, label: t.cashier },
    { id: "kitchen" as const, label: t.kitchen }
  ];
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const filteredCategories = categories.filter((category) =>
    category.displayName.toLowerCase().includes(categorySearch.toLowerCase())
  );

  useEffect(() => {
    fetch(`${apiUrl}/restaurants/${ownerRestaurantId}`)
      .then((response) => response.json())
      .then((payload) => {
        setRestaurantName(payload.data?.name ?? fallbackRestaurantName);
        setOwnerLanguage(String(payload.data?.operatingLanguage ?? "ru"));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    fetch(`${apiUrl}/restaurants/catalog/categories?language=${ownerLanguage}`)
      .then((response) => response.json())
      .then((payload) => setCategories(payload.data ?? []))
      .catch(() => setCategories([]));
    fetch(`${apiUrl}/restaurants/catalog/ingredients?language=${ownerLanguage}`)
      .then((response) => response.json())
      .then((payload) => setIngredients(payload.data ?? []))
      .catch(() => setIngredients([]));
    fetch(`${apiUrl}/orders?restaurantId=${ownerRestaurantId}&language=${ownerLanguage}`)
      .then((response) => response.json())
      .then((payload) => setRestaurantOrders(payload.data ?? []))
      .catch(() => setRestaurantOrders([]));
  }, [ownerLanguage]);

  async function updateOwnerLanguage(nextLanguage: string) {
    setOwnerLanguage(nextLanguage);
    await fetch(`${apiUrl}/restaurants/${ownerRestaurantId}/language`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operatingLanguage: nextLanguage })
    }).catch(() => undefined);
  }

  function toggleIngredient(ingredientId: string) {
    setSelectedIngredientIds((current) =>
      current.includes(ingredientId)
        ? current.filter((item) => item !== ingredientId)
        : [...current, ingredientId]
    );
  }

  async function addMeal() {
    const name = mealName.trim();

    if (!name || !selectedCategory) {
      return;
    }

    const selectedIngredients = ingredients
      .filter((ingredient) => selectedIngredientIds.includes(ingredient.id))
      .map((ingredient) => ingredient.displayName);

    const newItem = {
      id: `local-${Date.now()}`,
      category: selectedCategory.displayName,
      name,
      translatedName: name,
      ingredients: selectedIngredients,
      price: Number(mealPrice) || 0,
      available: true
    };

    setMenuItems((items) => [
      ...items,
      newItem
    ]);

    await fetch(`${apiUrl}/restaurants/${ownerRestaurantId}/menu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: ownerLanguage,
        categoryId: selectedCategory.id,
        ingredientIds: selectedIngredientIds,
        name,
        price: Number(mealPrice) || 0
      })
    }).catch(() => undefined);

    setMealName("");
    setMealPrice("0");
    setSelectedIngredientIds([]);
  }

  return (
    <main className="restaurant-console" dir={["ar", "ur", "fa", "he"].includes(ownerLanguage) ? "rtl" : "ltr"}>
      <aside className="restaurant-sidebar compact-owner-sidebar">
        <strong>Scan Menu OS</strong>
        {tabs.map((tab) => (
          <button
            className={activeTab === tab.id ? "active" : ""}
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <a className="logout-link" href="/">
          {t.back}
        </a>
      </aside>

      <section className="restaurant-workspace focused-owner-workspace">
        <header className="owner-topbar">
          <div>
            <p>{t.title}</p>
            <h1>{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
            <span>
              {t.restaurant}: {restaurantName}
            </span>
          </div>
          <div className="owner-language-controls">
            <label>
              {t.language}
              <select value={ownerLanguage} onChange={(event) => updateOwnerLanguage(event.target.value)}>
                {supportedLanguages.slice(0, 8).map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.nativeName}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="owner-stats">
            <span>
              {t.activeOrders} <strong>{restaurantOrders.length}</strong>
            </span>
          </div>
        </header>

        <SessionBar expectedArea="restaurant" />

        {activeTab === "menu" ? (
          <section className="owner-module-grid">
            <article className="owner-module-card wide">
              <div className="module-heading">
                <div>
                  <h2>{t.items}</h2>
                  <p>{t.menuHint}</p>
                </div>
              </div>

              <div className="menu-builder">
                <label>
                  {t.sectionSearch}
                  <input value={categorySearch} onChange={(event) => setCategorySearch(event.target.value)} />
                </label>
                <div className="pill-list">
                  {filteredCategories.map((category) => (
                    <button
                      className={selectedCategoryId === category.id ? "active" : ""}
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(category.id)}
                    >
                      {category.displayName}
                    </button>
                  ))}
                </div>
                <label>
                  {t.mealName}
                  <input value={mealName} onChange={(event) => setMealName(event.target.value)} />
                </label>
                <label>
                  {t.price}
                  <input type="number" value={mealPrice} onChange={(event) => setMealPrice(event.target.value)} />
                </label>
                <div>
                  <strong>{t.ingredients}</strong>
                  <div className="ingredient-grid">
                    {ingredients.map((ingredient) => (
                      <label key={ingredient.id}>
                        <input
                          type="checkbox"
                          checked={selectedIngredientIds.includes(ingredient.id)}
                          onChange={() => toggleIngredient(ingredient.id)}
                        />
                        {ingredient.displayName}
                      </label>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={addMeal}>
                  {t.addMeal}
                </button>
              </div>

              <div className="owner-table">
                <div className="owner-table-row header">
                  <span>{t.category}</span>
                  <span>{t.customerName}</span>
                  <span>{t.ownerName}</span>
                  <span>{t.price}</span>
                  <span>{t.status}</span>
                </div>
                {menuItems.map((item) => (
                  <div className="owner-table-row" key={item.id}>
                    <span>{item.category}</span>
                    <span>{item.name}</span>
                    <span>
                      {item.translatedName}
                      <small>{item.ingredients.join(", ")}</small>
                    </span>
                    <span>{item.price}$</span>
                    <button
                      className={item.available ? "success" : "muted"}
                      type="button"
                      onClick={() =>
                        setMenuItems((items) =>
                          items.map((current) =>
                            current.id === item.id ? { ...current, available: !current.available } : current
                          )
                        )
                      }
                    >
                      {item.available ? t.available : t.hidden}
                    </button>
                  </div>
                ))}
              </div>
            </article>

            <article className="owner-module-card">
              <h2>{t.category}</h2>
              <div className="pill-list">
                {categories.map((category) => (
                  <span key={category.id}>{category.displayName}</span>
                ))}
              </div>
            </article>
          </section>
        ) : null}

        {activeTab === "cashier" ? (
          <section className="cashier-board">
            <div className="cashier-orders">
              {restaurantOrders.map((order) => (
                <article className="cashier-table" key={order.id}>
                  <h3>{order.id}</h3>
                  <p>
                    {order.displayLines?.map((line) => (
                      <span key={line.menuItemId}>
                        {line.quantity} {line.displayName} {line.displayNote ? `- ${line.displayNote}` : ""}
                      </span>
                    ))}
                  </p>
                  <strong>{order.status}</strong>
                  <strong>
                    {order.total} {order.currency}
                  </strong>
                </article>
              ))}
            </div>
            <aside className="cashier-side">
              <article>
                <h3>{t.waiter}</h3>
                <p>Table 2 <button type="button">done</button></p>
                <p>Table 5 <button type="button">done</button></p>
              </article>
              <article>
                <h3>{t.reservations}</h3>
                <p>Ali, Table 7, 18:00 <button type="button">done</button></p>
              </article>
            </aside>
          </section>
        ) : null}

        {activeTab === "kitchen" ? (
          <section className="kitchen-grid focused-kitchen">
            {restaurantOrders.map((order) => (
              <article className="kitchen-ticket" key={order.id}>
                <h3>{order.id}</h3>
                <span className="status-chip preparing">{order.status}</span>
                {order.displayLines?.map((line) => (
                  <label key={line.menuItemId}>
                    <span>
                      {line.quantity} {line.displayName} {line.displayNote ? `- ${line.displayNote}` : ""}
                    </span>
                    <input type="checkbox" />
                  </label>
                ))}
                <button type="button">{t.start}</button>
                <button type="button">{t.ready}</button>
              </article>
            ))}
          </section>
        ) : null}
      </section>
    </main>
  );
}
