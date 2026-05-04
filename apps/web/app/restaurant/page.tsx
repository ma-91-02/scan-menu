"use client";

import { useEffect, useMemo, useState } from "react";
import { supportedLanguages, type SupportedLanguage } from "@scanmenu/shared";

type TabId = "menu" | "cashier" | "kitchen" | "employees" | "tables" | "plans" | "profile";

interface CatalogEntry {
  id: string;
  name?: Record<string, string>;
  translations?: Record<string, string>;
  displayName: string;
}

interface MenuEntry {
  id: string;
  categoryId?: string;
  imageUrl?: string;
  displayName: string;
  displayDescription: string;
  price: number;
  currency: string;
  isAvailable: boolean;
  ingredients?: CatalogEntry[];
}

interface RestaurantOrder {
  id: string;
  tableNumber?: string;
  status: string;
  total: number;
  currency: string;
  paymentMethod?: "cash" | "card";
  paymentStatus?: "paid" | "unpaid";
  type?: "order" | "waiter_request";
  displayLines?: Array<{
    menuItemId: string;
    quantity: number;
    displayName?: string;
    displayNote?: string;
    displayIngredients?: string[];
    displayRemovedIngredients?: string[];
    kitchenStatus?: "pending" | "preparing" | "ready";
  }>;
}

interface Plan {
  id: "basic" | "standard" | "premium" | "gold";
  name: string;
  priceMonthly: number;
  features: string[];
}

interface RestaurantProfile {
  id: string;
  name: string;
  operatingLanguage: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  city?: string;
  selectedPlan?: Plan["id"];
}

interface RestaurantTable {
  id: string;
  number: string;
  qrPath: string;
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  permissions?: string[];
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const ownerRestaurantId = "rst_bistro_01";
const sessionStorageKey = "scanmenu-session";

const copy = {
  ar: {
    title: "لوحة صاحب المطعم",
    menu: "المنيو",
    cashier: "الكاشير",
    kitchen: "المطبخ",
    employees: "الموظفون",
    tables: "الطاولات و QR",
    plans: "الاشتراك",
    profile: "الملف الشخصي",
    language: "لغة المطعم",
    add: "إضافة",
    save: "حفظ",
    ready: "جاهز",
    preparing: "قيد التحضير",
    paid: "مدفوع",
    cancel: "إلغاء",
    waiter: "طلبات النادل",
    removed: "بدون",
    back: "العودة للواجهة",
    logout: "تسجيل الخروج",
    addCategory: "إضافة قسم",
    categorySearch: "ابحث أو اكتب اسم القسم",
    addItemToCategory: "إضافة طبق",
    itemName: "اسم الطبق",
    description: "الوصف",
    price: "السعر",
    ingredients: "المكونات",
    ingredientSearch: "ابحث عن مكون",
    imageUrl: "رابط صورة الطبق",
    emptySectionsTitle: "أنشئ أول قسم",
    emptySectionsBody: "الأقسام تنظّم الأطباق قبل ظهورها للعميل. أضف مشروبات أو مشويات أو بيتزا أو حلويات أو أي قسم بلغة المطعم."
  },
  en: {
    title: "Restaurant dashboard",
    menu: "Menu",
    cashier: "Cashier",
    kitchen: "Kitchen",
    employees: "Employees",
    tables: "Tables & QR",
    plans: "Subscription",
    profile: "Profile",
    language: "Restaurant language",
    add: "Add",
    save: "Save",
    ready: "Ready",
    preparing: "Preparing",
    paid: "Paid",
    cancel: "Cancel",
    waiter: "Waiter requests",
    removed: "No",
    back: "Back to public site",
    logout: "Logout",
    addCategory: "Add section",
    categorySearch: "Search or type section name",
    addItemToCategory: "Add item",
    itemName: "Item name",
    description: "Description",
    price: "Price",
    ingredients: "Ingredients",
    ingredientSearch: "Search ingredient",
    imageUrl: "Dish image URL",
    emptySectionsTitle: "Create your first section",
    emptySectionsBody: "Sections organize dishes before customers see the menu. Add drinks, grills, pizza, desserts, or any restaurant section in your own language."
  },
  ru: {
    title: "Панель ресторана",
    menu: "Меню",
    cashier: "Касса",
    kitchen: "Кухня",
    employees: "Сотрудники",
    tables: "Столы и QR",
    plans: "Подписка",
    profile: "Профиль",
    language: "Язык ресторана",
    add: "Добавить",
    save: "Сохранить",
    ready: "Готово",
    preparing: "Готовится",
    paid: "Оплачено",
    cancel: "Отменить",
    waiter: "Вызовы официанта",
    removed: "Без",
    back: "Назад на сайт",
    logout: "Выйти",
    addCategory: "Добавить раздел",
    categorySearch: "Найдите или введите название раздела",
    addItemToCategory: "Добавить блюдо",
    itemName: "Название блюда",
    description: "Описание",
    price: "Цена",
    ingredients: "Ингредиенты",
    ingredientSearch: "Найти ингредиент",
    imageUrl: "Ссылка на фото блюда",
    emptySectionsTitle: "Создайте первый раздел",
    emptySectionsBody: "Разделы упорядочивают блюда до показа меню гостям. Добавьте напитки, гриль, пиццу, десерты или любой раздел на языке ресторана."
  },
  tr: {
    title: "Restoran paneli",
    menu: "Menü",
    cashier: "Kasa",
    kitchen: "Mutfak",
    employees: "Çalışanlar",
    tables: "Masalar ve QR",
    plans: "Abonelik",
    profile: "Profil",
    language: "Restoran dili",
    add: "Ekle",
    save: "Kaydet",
    ready: "Hazır",
    preparing: "Hazırlanıyor",
    paid: "Ödendi",
    cancel: "İptal",
    waiter: "Garson çağrıları",
    removed: "Yok",
    back: "Siteye dön",
    logout: "Çıkış",
    addCategory: "Bölüm ekle",
    categorySearch: "Bölüm adı ara veya yaz",
    addItemToCategory: "Ürün ekle",
    itemName: "Ürün adı",
    description: "Açıklama",
    price: "Fiyat",
    ingredients: "Malzemeler",
    ingredientSearch: "Malzeme ara",
    imageUrl: "Yemek görseli URL",
    emptySectionsTitle: "İlk bölümü oluştur",
    emptySectionsBody: "Bölümler, müşteriler menüyü görmeden önce yemekleri düzenler. İçecek, ızgara, pizza, tatlı veya herhangi bir bölümü restoran dilinde ekleyin."
  }
};

export default function RestaurantDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("menu");
  const [role, setRole] = useState("owner");
  const [languages, setLanguages] = useState<SupportedLanguage[]>(supportedLanguages);
  const [profile, setProfile] = useState<RestaurantProfile>({ id: ownerRestaurantId, name: "Bistro Aurora", operatingLanguage: "ru" });
  const [ownerLanguage, setOwnerLanguage] = useState("ru");
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [categories, setCategories] = useState<CatalogEntry[]>([]);
  const [ingredients, setIngredients] = useState<CatalogEntry[]>([]);
  const [menu, setMenu] = useState<MenuEntry[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "", price: "0", categoryId: "", ingredientIds: [] as string[] });
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [showCategorySearch, setShowCategorySearch] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [staffForm, setStaffForm] = useState({ name: "", email: "", username: "", role: "viewer" });
  const [tableNumber, setTableNumber] = useState("");
  const [ui, setUi] = useState<Record<string, string>>({});

  const t = copy[ownerLanguage as keyof typeof copy] ?? copy.en;
  const tt = (key: string, fallback: string) => ui[key] ?? fallback;
  const profileLabels: Record<keyof Pick<RestaurantProfile, "ownerFirstName" | "ownerLastName" | "email" | "name" | "phone" | "address" | "country" | "city">, string> = {
    ownerFirstName: tt("profile.owner_first_name", "First name"),
    ownerLastName: tt("profile.owner_last_name", "Last name"),
    email: tt("form.email", "Email"),
    name: tt("profile.restaurant_name", "Restaurant name"),
    phone: tt("profile.phone", "Phone"),
    address: tt("profile.address", "Address"),
    country: tt("profile.country", "Country"),
    city: tt("profile.city", "City")
  };
  const allTabs = [
    { id: "menu" as const, label: tt("restaurant.menu", t.menu) },
    { id: "kitchen" as const, label: tt("restaurant.kitchen", t.kitchen) },
    { id: "cashier" as const, label: tt("restaurant.cashier", t.cashier) },
    { id: "employees" as const, label: tt("restaurant.employees", t.employees) },
    { id: "tables" as const, label: tt("restaurant.tables_qr", t.tables) },
    { id: "plans" as const, label: tt("restaurant.subscription", t.plans) },
    { id: "profile" as const, label: tt("restaurant.profile", t.profile) }
  ];
  const tabs = allTabs.filter((tab) => canSeeTab(role, tab.id));
  const activeOrders = useMemo(() => orders.filter((order) => !["completed", "cancelled"].includes(order.status)), [orders]);
  const kitchenOrders = activeOrders.filter((order) => order.type !== "waiter_request");
  const waiterRequests = activeOrders.filter((order) => order.type === "waiter_request");
  const visibleCategories = useMemo(() => searchEntries(categories, categorySearch), [categories, categorySearch]);
  const visibleIngredients = useMemo(() => searchEntries(ingredients, ingredientSearch).filter((ingredient) => !form.ingredientIds.includes(ingredient.id)).slice(0, 8), [form.ingredientIds, ingredientSearch, ingredients]);
  const selectedIngredients = ingredients.filter((ingredient) => form.ingredientIds.includes(ingredient.id));
  const menuByActiveCategory = activeCategoryId ? menu.filter((item) => item.categoryId === activeCategoryId) : menu;
  const paymentLabel = (value?: string) => tt(`payment.${value ?? "cash"}`, value ?? "cash");
  const statusLabel = (value?: string) => tt(`status.${value ?? "pending"}`, value ?? "pending");

  useEffect(() => {
    void loadBootstrap();
  }, []);

  useEffect(() => {
    const selectedLanguage = languages.find((language) => language.code === ownerLanguage);
    const nextDirection = selectedLanguage?.direction ?? (["ar", "ur", "fa", "he"].includes(ownerLanguage) ? "rtl" : "ltr");
    document.documentElement.lang = ownerLanguage;
    document.documentElement.dir = nextDirection;
  }, [languages, ownerLanguage]);

  useEffect(() => {
    const sessionId = localStorage.getItem(sessionStorageKey);
    if (!sessionId) return;

    fetch(`${apiUrl}/auth/session/${sessionId}`)
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        const nextRole = payload?.data?.user?.role;
        if (nextRole) setRole(String(nextRole));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!canSeeTab(role, activeTab)) {
      setActiveTab(defaultTabForRole(role));
    }
  }, [activeTab, role]);

  useEffect(() => {
    void loadLocalizedData(ownerLanguage);
    void fetchJson(`/translations/translations/${ownerLanguage}`, {} as Record<string, string>).then(setUi);
    const events = new EventSource(`${apiUrl}/orders/events?restaurantId=${ownerRestaurantId}&language=${ownerLanguage}`);
    const update = (event: Event) => {
      const payload = JSON.parse((event as MessageEvent).data);
      setOrders(payload.data ?? []);
    };
    events.addEventListener("snapshot", update);
    events.addEventListener("orders", update);
    return () => events.close();
  }, [ownerLanguage]);

  async function loadBootstrap() {
    const [languagePayload, profilePayload, plansPayload, tablesPayload, staffPayload] = await Promise.all([
      fetchJson("/translations/languages", supportedLanguages),
      fetchJson(`/restaurants/${ownerRestaurantId}`, profile),
      fetchJson("/restaurants/plans", [] as Plan[]),
      fetchJson(`/restaurants/${ownerRestaurantId}/tables`, [] as RestaurantTable[]),
      fetchStaff()
    ]);
    setLanguages(languagePayload);
    setProfile(profilePayload);
    setOwnerLanguage(profilePayload.operatingLanguage ?? "ru");
    setPlans(plansPayload);
    setTables(tablesPayload);
    setStaff(staffPayload);
  }

  async function loadLocalizedData(language: string) {
    const [categoryPayload, ingredientPayload, menuPayload, orderPayload] = await Promise.all([
      fetchJson(`/restaurants/${ownerRestaurantId}/catalog/categories?language=${language}`, [] as CatalogEntry[]),
      fetchJson(`/translations/ingredients/${language}`, [] as CatalogEntry[]),
      fetchJson(`/restaurants/${ownerRestaurantId}/menu?language=${language}`, [] as MenuEntry[]),
      fetchJson(`/orders?restaurantId=${ownerRestaurantId}&language=${language}`, [] as RestaurantOrder[])
    ]);
    setCategories(categoryPayload);
    setIngredients(ingredientPayload);
    setMenu(menuPayload);
    setOrders(orderPayload);
    const nextCategoryId = activeCategoryId || categoryPayload[0]?.id || "";
    setActiveCategoryId(nextCategoryId);
    setForm((current) => ({ ...current, categoryId: current.categoryId || nextCategoryId }));
  }

  async function fetchJson<T>(path: string, fallback: T): Promise<T> {
    try {
      const response = await fetch(`${apiUrl}${path}`);
      const payload = await response.json();
      return response.ok ? payload.data ?? fallback : fallback;
    } catch {
      return fallback;
    }
  }

  async function fetchStaff() {
    const sessionId = localStorage.getItem(sessionStorageKey);
    if (!sessionId) return [] as StaffUser[];

    try {
      const response = await fetch(`${apiUrl}/auth/restaurants/${ownerRestaurantId}/staff`, {
        headers: { "x-session-id": sessionId }
      });
      const payload = await response.json();
      return response.ok ? payload.data ?? [] : [];
    } catch {
      return [];
    }
  }

  function sessionHeader(): Record<string, string> {
    const sessionId = localStorage.getItem(sessionStorageKey);
    return sessionId ? { "x-session-id": sessionId } : {};
  }

  async function updateOwnerLanguage(nextLanguage: string) {
    setOwnerLanguage(nextLanguage);
    await fetch(`${apiUrl}/restaurants/${ownerRestaurantId}/language`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operatingLanguage: nextLanguage })
    }).catch(() => undefined);
  }

  async function addMenuItem() {
    if (!form.name.trim()) return;
    await fetch(`${apiUrl}/restaurants/${ownerRestaurantId}/menu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: ownerLanguage,
        categoryId: form.categoryId,
        ingredientIds: form.ingredientIds,
        name: form.name,
        description: form.description,
        imageUrl: form.imageUrl,
        price: Number(form.price) || 0
      })
    });
    setForm({ name: "", description: "", imageUrl: "", price: "0", categoryId: activeCategoryId || categories[0]?.id || "", ingredientIds: [] });
    setIngredientSearch("");
    await loadLocalizedData(ownerLanguage);
  }

  async function addCategory() {
    const name = categorySearch.trim();
    if (!name) return;

    const existing = categories.find((category) => matchesEntry(category, name));
    if (existing) {
      setActiveCategoryId(existing.id);
      setForm((current) => ({ ...current, categoryId: existing.id }));
      setShowCategorySearch(false);
      setCategorySearch("");
      return;
    }

    const response = await fetch(`${apiUrl}/restaurants/${ownerRestaurantId}/catalog/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: ownerLanguage, name })
    });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.data?.id) {
      setActiveCategoryId(payload.data.id);
      setForm((current) => ({ ...current, categoryId: payload.data.id }));
      setShowCategorySearch(false);
      setCategorySearch("");
      await loadLocalizedData(ownerLanguage);
    }
  }

  async function patchOrder(path: string, body: Record<string, unknown>) {
    await fetch(`${apiUrl}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  }

  async function selectPlan(planId: string) {
    const response = await fetch(`${apiUrl}/restaurants/${ownerRestaurantId}/plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId })
    });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.data?.restaurant) {
      setProfile(payload.data.restaurant);
    }
  }

  async function createStaff() {
    if (!staffForm.name.trim() || !staffForm.email.trim()) return;
    await fetch(`${apiUrl}/auth/register/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...sessionHeader() },
      body: JSON.stringify({
        ...staffForm,
        restaurantId: ownerRestaurantId,
        restaurantName: profile.name,
        preferredLanguage: ownerLanguage
      })
    });
    setStaffForm({ name: "", email: "", username: "", role: "viewer" });
    const staffPayload = await fetchStaff();
    setStaff(staffPayload);
  }

  async function createTable() {
    if (!tableNumber.trim()) return;
    await fetch(`${apiUrl}/restaurants/${ownerRestaurantId}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: tableNumber })
    });
    setTableNumber("");
    setTables(await fetchJson(`/restaurants/${ownerRestaurantId}/tables`, [] as RestaurantTable[]));
  }

  async function saveProfile() {
    const response = await fetch(`${apiUrl}/restaurants/${ownerRestaurantId}/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerFirstName: profile.ownerFirstName,
        ownerLastName: profile.ownerLastName,
        email: profile.email,
        restaurantName: profile.name,
        phone: profile.phone,
        address: profile.address,
        country: profile.country,
        city: profile.city
      })
    });
    const payload = await response.json();
    if (response.ok) setProfile(payload.data);
  }

  async function logout() {
    const sessionId = localStorage.getItem(sessionStorageKey);
    if (sessionId) {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      }).catch(() => undefined);
    }
    localStorage.removeItem(sessionStorageKey);
    window.location.href = "/";
  }

  return (
    <main className="restaurant-console" dir={["ar", "ur", "fa", "he"].includes(ownerLanguage) ? "rtl" : "ltr"}>
      <aside className="restaurant-sidebar compact-owner-sidebar">
        <strong>Scan Menu OS</strong>
        {tabs.map((tab) => (
          <button className={activeTab === tab.id ? "active" : ""} key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
        <div className="sidebar-bottom-actions">
          <button className="logout-button" type="button" onClick={() => void logout()}>{tt("restaurant.logout", t.logout)}</button>
          <a className="logout-link" href="/">{tt("restaurant.back_public", t.back)}</a>
        </div>
      </aside>

      <section className="restaurant-workspace focused-owner-workspace">
        <header className="owner-topbar">
          <div>
            <p>{tt("restaurant.dashboard", t.title)}</p>
            <h1>{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
            <span>{profile.name}</span>
          </div>
          <div className="owner-language-controls">
            <label>
              {tt("restaurant.language", t.language)}
              <select value={ownerLanguage} onChange={(event) => void updateOwnerLanguage(event.target.value)}>
                {languages.map((language) => (
                  <option key={language.code} value={language.code}>{language.nativeName}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="owner-stats">
            <span>{tt("restaurant.kitchen", t.kitchen)} <strong>{kitchenOrders.length}</strong></span>
            <span>{tt("restaurant.waiter_requests", t.waiter)} <strong>{waiterRequests.length}</strong></span>
          </div>
        </header>

        {activeTab === "menu" ? (
          <section className="owner-module-grid">
            <article className="owner-module-card wide">
              <div className="module-heading">
                <h2>{tt("restaurant.menu", t.menu)}</h2>
                <button className="section-add-button" type="button" onClick={() => setShowCategorySearch((value) => !value)}>+ {tt("restaurant.add_section", t.addCategory)}</button>
              </div>
              {showCategorySearch ? (
                <div className="catalog-search-panel">
                  <input
                    autoFocus
                    placeholder={tt("restaurant.category_search", t.categorySearch)}
                    value={categorySearch}
                    onChange={(event) => setCategorySearch(event.target.value)}
                  />
                  <button type="button" onClick={() => void addCategory()}>+ {tt("common.add", t.add)}</button>
                  <div className="catalog-suggestion-list">
                    {visibleCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          setActiveCategoryId(category.id);
                          setForm((current) => ({ ...current, categoryId: category.id }));
                          setShowCategorySearch(false);
                          setCategorySearch("");
                        }}
                      >
                        {category.displayName}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="category-board">
                {categories.map((category) => (
                  <button
                    className={activeCategoryId === category.id ? "active" : ""}
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setActiveCategoryId(category.id);
                      setForm((current) => ({ ...current, categoryId: category.id }));
                    }}
                  >
                    <span>{category.displayName}</span>
                    <strong>+ {tt("restaurant.add_dish", t.addItemToCategory)}</strong>
                  </button>
                ))}
              </div>
              {categories.length ? (
                <div className="menu-builder">
                  <label>{tt("restaurant.item_name", t.itemName)}<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
                  <label>{tt("restaurant.description", t.description)}<input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
                  <label>{tt("restaurant.image_url", t.imageUrl)}<input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} /></label>
                  <label>{tt("restaurant.price", t.price)}<input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
                  <label>{tt("restaurant.section", "Section")}<select value={form.categoryId} onChange={(event) => {
                    setActiveCategoryId(event.target.value);
                    setForm({ ...form, categoryId: event.target.value });
                  }}>{categories.map((category) => <option key={category.id} value={category.id}>{category.displayName}</option>)}</select></label>
                  <div className="ingredient-picker">
                    <label>{tt("restaurant.ingredients", t.ingredients)}<input placeholder={tt("restaurant.search_ingredient", t.ingredientSearch)} value={ingredientSearch} onChange={(event) => setIngredientSearch(event.target.value)} /></label>
                    {selectedIngredients.length ? (
                      <div className="selected-ingredient-list">
                        {selectedIngredients.map((ingredient) => (
                          <button key={ingredient.id} type="button" onClick={() => setForm((current) => ({ ...current, ingredientIds: current.ingredientIds.filter((id) => id !== ingredient.id) }))}>
                            {ingredient.displayName} ×
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <div className="catalog-suggestion-list ingredient-suggestions">
                      {visibleIngredients.map((ingredient) => (
                        <button key={ingredient.id} type="button" onClick={() => {
                          setForm((current) => ({ ...current, ingredientIds: [...new Set([...current.ingredientIds, ingredient.id])] }));
                          setIngredientSearch("");
                        }}>
                          + {ingredient.displayName}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="button" onClick={() => void addMenuItem()}>{tt("common.add", t.add)}</button>
                </div>
              ) : (
                <div className="menu-empty-state">
                  <strong>{tt("restaurant.empty_sections_title", t.emptySectionsTitle)}</strong>
                  <p>{tt("restaurant.empty_sections_body", t.emptySectionsBody)}</p>
                </div>
              )}
              <div className="owner-table">
                {menuByActiveCategory.map((item) => (
                  <div className="owner-table-row menu-row" key={item.id}>
                    <span>{item.imageUrl ? <img alt="" className="menu-item-thumb" src={item.imageUrl} /> : null}{item.displayName}</span>
                    <span>{item.ingredients?.map((ingredient) => ingredient.displayName).join(", ")}</span>
                    <span>{item.price} {item.currency}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        ) : null}

        {activeTab === "kitchen" ? (
          <section className="kitchen-grid focused-kitchen">
            {kitchenOrders.map((order) => (
              <article className="kitchen-ticket" key={order.id}>
                <h3>{tt("restaurant.table", "Table")} {order.tableNumber ?? "-"}</h3>
                <span className="status-chip preparing">{statusLabel(order.status)}</span>
                {order.displayLines?.map((line) => (
                  <label key={`${order.id}-${line.menuItemId}`}>
                    <span>
                      {line.quantity} {line.displayName}
                      {line.displayRemovedIngredients?.length ? ` | ${tt("order.removed", t.removed)}: ${line.displayRemovedIngredients.join(", ")}` : ""}
                    </span>
                    <button type="button" onClick={() => void patchOrder(`/orders/${order.id}/lines/${line.menuItemId}/status`, { kitchenStatus: line.kitchenStatus === "ready" ? "preparing" : "ready" })}>
                      {statusLabel(line.kitchenStatus)}
                    </button>
                  </label>
                ))}
              </article>
            ))}
          </section>
        ) : null}

        {activeTab === "cashier" ? (
          <section className="cashier-board">
            <div className="cashier-orders">
              {activeOrders.map((order) => (
                <article className="cashier-table" key={order.id}>
                  <h3>{tt("restaurant.table", "Table")} {order.tableNumber ?? "-"}</h3>
                  <p>{order.displayLines?.map((line) => <span key={line.menuItemId}>{line.quantity} {line.displayName}</span>)}</p>
                  <strong>{order.total} {order.currency}</strong>
                  <strong>{paymentLabel(order.paymentMethod)} / {paymentLabel(order.paymentStatus ?? "unpaid")}</strong>
                  <button type="button" onClick={() => void patchOrder(`/orders/${order.id}/payment`, { paymentMethod: order.paymentMethod ?? "cash", paymentStatus: "paid" })}>{tt("common.paid", t.paid)}</button>
                  <button type="button" onClick={() => void patchOrder(`/orders/${order.id}/status`, { status: "cancelled" })}>{tt("common.cancel", t.cancel)}</button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "employees" ? (
          <section className="owner-module-card">
            <h2>{tt("restaurant.employees", t.employees)}</h2>
            <div className="menu-builder">
              <input placeholder={tt("form.name", "Name")} value={staffForm.name} onChange={(event) => setStaffForm({ ...staffForm, name: event.target.value })} />
              <input placeholder={tt("form.email", "Email")} value={staffForm.email} onChange={(event) => setStaffForm({ ...staffForm, email: event.target.value })} />
              <input placeholder={tt("form.username", "Username")} value={staffForm.username} onChange={(event) => setStaffForm({ ...staffForm, username: event.target.value })} />
              <select value={staffForm.role} onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value })}>
                {["owner", "manager", "cashier", "kitchen", "waiter", "viewer"].map((role) => <option key={role}>{role}</option>)}
              </select>
              <button type="button" onClick={() => void createStaff()}>{tt("common.add", t.add)}</button>
            </div>
            {staff.map((user) => <div className="language-row" key={user.id}><strong>{user.name}</strong><span className="status">{user.role}</span></div>)}
          </section>
        ) : null}

        {activeTab === "tables" ? (
          <section className="owner-module-card">
            <h2>{tt("restaurant.tables_qr", t.tables)}</h2>
            <div className="menu-builder">
              <input placeholder={tt("restaurant.table_number", "Table number")} value={tableNumber} onChange={(event) => setTableNumber(event.target.value)} />
              <button type="button" onClick={() => void createTable()}>{tt("common.add", t.add)}</button>
            </div>
            {tables.map((table) => <div className="language-row" key={table.id}><strong>{tt("restaurant.table", "Table")} {table.number}</strong><span>{table.qrPath}</span></div>)}
          </section>
        ) : null}

        {activeTab === "plans" ? (
          <section className="pricing-grid">
            {plans.map((plan) => (
              <article className="pricing-card" key={plan.id}>
                <h3>{plan.name}</h3>
                <strong>${plan.priceMonthly}/{tt("common.month", "month")}</strong>
                <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                <button className="public-button primary" type="button" onClick={() => void selectPlan(plan.id)}>
                  {profile.selectedPlan === plan.id ? tt("common.selected", "Selected") : tt("common.select", "Select")}
                </button>
              </article>
            ))}
          </section>
        ) : null}

        {activeTab === "profile" ? (
          <section className="registration-form restaurant-profile-form">
            {(["ownerFirstName", "ownerLastName", "email", "name", "phone", "address", "country", "city"] as const).map((field) => (
              <label key={field}>
                {profileLabels[field]}
                <input value={String(profile[field] ?? "")} onChange={(event) => setProfile({ ...profile, [field]: event.target.value })} />
              </label>
            ))}
            <button className="public-button primary wide" type="button" onClick={() => void saveProfile()}>{tt("common.save", t.save)}</button>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function canSeeTab(role: string, tab: TabId) {
  if (role === "kitchen") return tab === "kitchen";
  if (role === "cashier") return tab === "cashier";
  if (role === "waiter") return tab === "cashier";
  if (role === "viewer") return ["menu", "kitchen", "cashier"].includes(tab);
  if (role === "manager") return tab !== "plans" && tab !== "profile";
  return true;
}

function defaultTabForRole(role: string): TabId {
  if (role === "kitchen") return "kitchen";
  if (role === "cashier" || role === "waiter") return "cashier";
  return "menu";
}

function matchesEntry(entry: CatalogEntry, query: string) {
  const value = query.trim().toLowerCase();
  return Object.values(entry.name ?? entry.translations ?? { en: entry.displayName }).some((name) => String(name).toLowerCase().includes(value));
}

function searchEntries(entries: CatalogEntry[], query: string) {
  const value = query.trim();
  if (!value) return entries;
  return entries.filter((entry) => matchesEntry(entry, value));
}
