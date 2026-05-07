"use client";

import { useEffect, useMemo, useState } from "react";
import { supportedLanguages, type SupportedLanguage } from "@scanmenu/shared";

type TabId = "menu" | "cashier" | "kitchen" | "employees" | "tables" | "plans" | "profile" | "settings";

interface CatalogEntry {
  id: string;
  catalogKey?: string;
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
  currency?: string;
  logoUrl?: string;
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
const fallbackRestaurantId = "rst_bistro_01";
const sessionStorageKey = "scanmenu-session";
const fallbackCurrencyCodes = [
  "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN", "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BRL", "BSD",
  "BTN", "BWP", "BYN", "BZD", "CAD", "CDF", "CHF", "CLP", "CNY", "COP", "CRC", "CUP", "CVE", "CZK", "DJF", "DKK", "DOP", "DZD", "EGP", "ERN", "ETB",
  "EUR", "FJD", "FKP", "GBP", "GEL", "GHS", "GIP", "GMD", "GNF", "GTQ", "GYD", "HKD", "HNL", "HTG", "HUF", "IDR", "ILS", "INR", "IQD", "IRR", "ISK",
  "JMD", "JOD", "JPY", "KES", "KGS", "KHR", "KMF", "KRW", "KWD", "KZT", "LAK", "LBP", "LKR", "LRD", "LSL", "LYD", "MAD", "MDL", "MGA", "MKD", "MMK",
  "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN", "MYR", "MZN", "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB", "PEN", "PGK", "PHP", "PKR",
  "PLN", "PYG", "QAR", "RON", "RSD", "RUB", "RWF", "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLE", "SOS", "SRD", "SSP", "STN", "SYP", "SZL",
  "THB", "TJS", "TMT", "TND", "TOP", "TRY", "TTD", "TWD", "TZS", "UAH", "UGX", "USD", "UYU", "UZS", "VES", "VND", "VUV", "WST", "XAF", "XCD", "XOF",
  "XPF", "YER", "ZAR", "ZMW", "ZWL"
];

const currencyDisplayNames: Record<string, Partial<Record<string, string>>> = {
  AED: { en: "UAE dirham", ar: "درهم إماراتي", fa: "درهم امارات", ru: "Дирхам ОАЭ", tr: "BAE dirhemi" },
  BHD: { en: "Bahraini dinar", ar: "دينار بحريني", fa: "دینار بحرین", ru: "Бахрейнский динар", tr: "Bahreyn dinarı" },
  CAD: { en: "Canadian dollar", ar: "دولار كندي", fa: "دلار کانادا", ru: "Канадский доллар", tr: "Kanada doları" },
  CHF: { en: "Swiss franc", ar: "فرنك سويسري", fa: "فرانک سوئیس", ru: "Швейцарский франк", tr: "İsviçre frangı" },
  CNY: { en: "Chinese yuan", ar: "يوان صيني", fa: "یوان چین", ru: "Китайский юань", tr: "Çin yuanı" },
  DZD: { en: "Algerian dinar", ar: "دينار جزائري", fa: "دینار الجزایر", ru: "Алжирский динар", tr: "Cezayir dinarı" },
  EGP: { en: "Egyptian pound", ar: "جنيه مصري", fa: "پوند مصر", ru: "Египетский фунт", tr: "Mısır lirası" },
  EUR: { en: "Euro", ar: "يورو", fa: "یورو", ru: "Евро", tr: "Euro" },
  GBP: { en: "British pound", ar: "جنيه إسترليني", fa: "پوند بریتانیا", ru: "Британский фунт", tr: "İngiliz sterlini" },
  IQD: { en: "Iraqi dinar", ar: "الدينار العراقي", fa: "دینار عراق", ru: "Иракский динар", tr: "Irak dinarı" },
  IRR: { en: "Iranian rial", ar: "ريال إيراني", fa: "ریال ایران", ru: "Иранский риал", tr: "İran riyali" },
  JOD: { en: "Jordanian dinar", ar: "دينار أردني", fa: "دینار اردن", ru: "Иорданский динар", tr: "Ürdün dinarı" },
  JPY: { en: "Japanese yen", ar: "ين ياباني", fa: "ین ژاپن", ru: "Японская иена", tr: "Japon yeni" },
  KWD: { en: "Kuwaiti dinar", ar: "دينار كويتي", fa: "دینار کویت", ru: "Кувейтский динар", tr: "Kuveyt dinarı" },
  LBP: { en: "Lebanese pound", ar: "ليرة لبنانية", fa: "پوند لبنان", ru: "Ливанский фунт", tr: "Lübnan lirası" },
  LYD: { en: "Libyan dinar", ar: "دينار ليبي", fa: "دینار لیبی", ru: "Ливийский динар", tr: "Libya dinarı" },
  MAD: { en: "Moroccan dirham", ar: "درهم مغربي", fa: "درهم مراکش", ru: "Марокканский дирхам", tr: "Fas dirhemi" },
  OMR: { en: "Omani rial", ar: "ريال عماني", fa: "ریال عمان", ru: "Оманский риал", tr: "Umman riyali" },
  QAR: { en: "Qatari riyal", ar: "ريال قطري", fa: "ریال قطر", ru: "Катарский риал", tr: "Katar riyali" },
  RUB: { en: "Russian ruble", ar: "روبل روسي", fa: "روبل روسیه", ru: "Российский рубль", tr: "Rus rublesi" },
  SAR: { en: "Saudi riyal", ar: "ريال سعودي", fa: "ریال سعودی", ru: "Саудовский риял", tr: "Suudi riyali" },
  SYP: { en: "Syrian pound", ar: "ليرة سورية", fa: "پوند سوریه", ru: "Сирийский фунт", tr: "Suriye lirası" },
  TND: { en: "Tunisian dinar", ar: "دينار تونسي", fa: "دینار تونس", ru: "Тунисский динар", tr: "Tunus dinarı" },
  TRY: { en: "Turkish lira", ar: "ليرة تركية", fa: "لیر ترکیه", ru: "Турецкая лира", tr: "Türk lirası" },
  USD: { en: "US dollar", ar: "دولار أمريكي", fa: "دلار آمریکا", ru: "Доллар США", tr: "ABD doları" },
  YER: { en: "Yemeni rial", ar: "ريال يمني", fa: "ریال یمن", ru: "Йеменский риал", tr: "Yemen riyali" }
};

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
    settings: "الإعدادات",
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
    imageUrl: "صورة الطبق",
    emptySectionsTitle: "أنشئ أول قسم",
    emptySectionsBody: "الأقسام تنظّم الأطباق قبل ظهورها للعميل. أضف مشروبات أو مشويات أو بيتزا أو حلويات أو أي قسم بلغة المطعم.",
    deleteAccount: "حذف الحساب",
    deleteAccountConfirm: "سيتم حذف حسابك وبيانات المطعم المرتبطة به. هل أنت متأكد؟"
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
    settings: "Settings",
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
    imageUrl: "Dish image",
    emptySectionsTitle: "Create your first section",
    emptySectionsBody: "Sections organize dishes before customers see the menu. Add drinks, grills, pizza, desserts, or any restaurant section in your own language.",
    deleteAccount: "Delete account",
    deleteAccountConfirm: "This will delete your account and linked restaurant data. Are you sure?"
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
    settings: "Настройки",
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
    imageUrl: "Фото блюда",
    emptySectionsTitle: "Создайте первый раздел",
    emptySectionsBody: "Разделы упорядочивают блюда до показа меню гостям. Добавьте напитки, гриль, пиццу, десерты или любой раздел на языке ресторана.",
    deleteAccount: "Удалить аккаунт",
    deleteAccountConfirm: "Аккаунт и связанные данные ресторана будут удалены. Вы уверены?"
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
    settings: "Ayarlar",
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
    imageUrl: "Yemek görseli",
    emptySectionsTitle: "İlk bölümü oluştur",
    emptySectionsBody: "Bölümler, müşteriler menüyü görmeden önce yemekleri düzenler. İçecek, ızgara, pizza, tatlı veya herhangi bir bölümü restoran dilinde ekleyin.",
    deleteAccount: "Hesabı sil",
    deleteAccountConfirm: "Hesabınız ve bağlı restoran verileri silinecek. Emin misiniz?"
  }
};

export default function RestaurantDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("menu");
  const [role, setRole] = useState("owner");
  const [languages, setLanguages] = useState<SupportedLanguage[]>(supportedLanguages);
  const [restaurantId, setRestaurantId] = useState(fallbackRestaurantId);
  const [profile, setProfile] = useState<RestaurantProfile>({ id: fallbackRestaurantId, name: "Bistro Aurora", operatingLanguage: "ru" });
  const [ownerLanguage, setOwnerLanguage] = useState("ru");
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [categories, setCategories] = useState<CatalogEntry[]>([]);
  const [standardCategories, setStandardCategories] = useState<CatalogEntry[]>([]);
  const [ingredients, setIngredients] = useState<CatalogEntry[]>([]);
  const [menu, setMenu] = useState<MenuEntry[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "", price: "0", categoryId: "", ingredientIds: [] as string[] });
  const [editingItemId, setEditingItemId] = useState("");
  const [restaurantCurrency, setRestaurantCurrency] = useState("USD");
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [isDishFormOpen, setIsDishFormOpen] = useState(false);
  const [showCategorySearch, setShowCategorySearch] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [currencySearch, setCurrencySearch] = useState("");
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
    { id: "profile" as const, label: tt("restaurant.profile", t.profile) },
    { id: "settings" as const, label: tt("restaurant.settings", t.settings) }
  ];
  const tabs = allTabs.filter((tab) => canSeeTab(role, tab.id));
  const activeOrders = useMemo(() => orders.filter((order) => !["completed", "cancelled"].includes(order.status)), [orders]);
  const kitchenOrders = activeOrders.filter((order) => order.type !== "waiter_request");
  const waiterRequests = activeOrders.filter((order) => order.type === "waiter_request");
  const categorySuggestions = useMemo(() => {
    const existingIds = new Set(categories.map((category) => category.id));
    const existingCatalogKeys = new Set(categories.map((category) => category.catalogKey).filter(Boolean));
    return [...categories, ...standardCategories.filter((category) => !existingIds.has(category.id) && !existingCatalogKeys.has(category.id))];
  }, [categories, standardCategories]);
  const visibleCategories = useMemo(() => searchEntries(categorySuggestions, categorySearch), [categorySearch, categorySuggestions]);
  const visibleIngredients = useMemo(() => searchEntries(ingredients, ingredientSearch).filter((ingredient) => !form.ingredientIds.includes(ingredient.id)).slice(0, 8), [form.ingredientIds, ingredientSearch, ingredients]);
  const selectedIngredients = ingredients.filter((ingredient) => form.ingredientIds.includes(ingredient.id));
  const uncategorizedMenu = menu.filter((item) => !item.categoryId || !categories.some((category) => category.id === item.categoryId));
  const currencyOptions = useMemo(() => searchCurrencyCodes(currencySearch, ownerLanguage), [currencySearch, ownerLanguage]);
  const visibleCurrencyResults = useMemo(() => (currencySearch.trim() ? currencyOptions.slice(0, 10) : []), [currencyOptions, currencySearch]);
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
    if (!canSeeTab(role, activeTab)) {
      setActiveTab(defaultTabForRole(role));
    }
  }, [activeTab, role]);

  useEffect(() => {
    void loadLocalizedData(ownerLanguage);
    void fetchJson(`/translations/translations/${ownerLanguage}`, {} as Record<string, string>).then(setUi);
    const events = new EventSource(`${apiUrl}/orders/events?restaurantId=${restaurantId}&language=${ownerLanguage}`);
    const update = (event: Event) => {
      const payload = JSON.parse((event as MessageEvent).data);
      setOrders(payload.data ?? []);
    };
    events.addEventListener("snapshot", update);
    events.addEventListener("orders", update);
    return () => events.close();
  }, [ownerLanguage, restaurantId]);

  async function loadBootstrap() {
    const session = await loadSession();
    const sessionUser = session?.data?.user;
    const nextRestaurantId = sessionUser?.restaurantId ? String(sessionUser.restaurantId) : fallbackRestaurantId;
    const nextRole = sessionUser?.staffRole ?? sessionUser?.role;
    setRestaurantId(nextRestaurantId);
    if (nextRole) setRole(String(nextRole));

    const [languagePayload, profilePayload, plansPayload, tablesPayload, staffPayload] = await Promise.all([
      fetchJson("/translations/languages", supportedLanguages),
      fetchJson(`/restaurants/${nextRestaurantId}`, { ...profile, id: nextRestaurantId }),
      fetchJson("/restaurants/plans", [] as Plan[]),
      fetchJson(`/restaurants/${nextRestaurantId}/tables`, [] as RestaurantTable[]),
      fetchStaff(nextRestaurantId)
    ]);
    setLanguages(languagePayload);
    setProfile(profilePayload);
    setOwnerLanguage(profilePayload.operatingLanguage ?? "ru");
    setRestaurantCurrency(profilePayload.currency ?? "USD");
    setPlans(plansPayload);
    setTables(tablesPayload);
    setStaff(staffPayload);
  }

  async function loadLocalizedData(language: string) {
    const [categoryPayload, standardCategoryPayload, ingredientPayload, menuPayload, orderPayload] = await Promise.all([
      fetchJson(`/restaurants/${restaurantId}/catalog/categories?language=${language}`, [] as CatalogEntry[]),
      fetchJson(`/translations/sections/${language}`, [] as CatalogEntry[]),
      fetchJson(`/translations/ingredients/${language}`, [] as CatalogEntry[]),
      fetchJson(`/restaurants/${restaurantId}/menu?language=${language}`, [] as MenuEntry[]),
      fetchJson(`/orders?restaurantId=${restaurantId}&language=${language}`, [] as RestaurantOrder[])
    ]);
    setCategories(categoryPayload);
    setStandardCategories(standardCategoryPayload);
    setIngredients(ingredientPayload);
    setMenu(menuPayload);
    setOrders(orderPayload);
    const nextCategoryId = categoryPayload.some((category) => category.id === activeCategoryId) ? activeCategoryId : categoryPayload[0]?.id || "";
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

  async function loadSession() {
    const sessionId = localStorage.getItem(sessionStorageKey);
    if (!sessionId) return null;
    try {
      const response = await fetch(`${apiUrl}/auth/session/${sessionId}`);
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  }

  async function fetchStaff(nextRestaurantId = restaurantId) {
    const sessionId = localStorage.getItem(sessionStorageKey);
    if (!sessionId) return [] as StaffUser[];

    try {
      const response = await fetch(`${apiUrl}/auth/restaurants/${nextRestaurantId}/staff`, {
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
    await fetch(`${apiUrl}/restaurants/${restaurantId}/language`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operatingLanguage: nextLanguage })
    }).catch(() => undefined);
  }

  async function updateRestaurantCurrency(nextCurrency: string) {
    setRestaurantCurrency(nextCurrency);
    setCurrencySearch("");
    const response = await fetch(`${apiUrl}/restaurants/${restaurantId}/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: nextCurrency })
    }).catch(() => null);
    const payload = await response?.json().catch(() => null);
    if (payload?.data) setProfile(payload.data);
  }

  async function handleDishImageUpload(file?: File) {
    if (!file) return;
    const imageUrl = await fileToDataUrl(file);
    setForm((current) => ({ ...current, imageUrl }));
  }

  async function handleLogoUpload(file?: File) {
    if (!file) return;
    const logoUrl = await fileToDataUrl(file);
    const nextProfile = { ...profile, logoUrl };
    setProfile(nextProfile);
    const response = await fetch(`${apiUrl}/restaurants/${restaurantId}/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerFirstName: nextProfile.ownerFirstName,
        ownerLastName: nextProfile.ownerLastName,
        email: nextProfile.email,
        restaurantName: nextProfile.name,
        phone: nextProfile.phone,
        address: nextProfile.address,
        country: nextProfile.country,
        city: nextProfile.city,
        currency: restaurantCurrency,
        logoUrl
      })
    }).catch(() => null);
    const payload = await response?.json().catch(() => null);
    if (payload?.data) setProfile(payload.data);
  }

  async function saveMenuItem() {
    if (!form.name.trim()) return;
    const path = editingItemId
      ? `${apiUrl}/restaurants/${restaurantId}/menu/${editingItemId}`
      : `${apiUrl}/restaurants/${restaurantId}/menu`;
    await fetch(path, {
      method: editingItemId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: ownerLanguage,
        categoryId: form.categoryId,
        ingredientIds: form.ingredientIds,
        name: form.name,
        description: form.description,
        imageUrl: form.imageUrl,
        price: Number(form.price) || 0,
        currency: restaurantCurrency
      })
    });
    resetMenuForm();
    setIngredientSearch("");
    await loadLocalizedData(ownerLanguage);
  }

  function resetMenuForm() {
    setEditingItemId("");
    setIsDishFormOpen(false);
    setForm({ name: "", description: "", imageUrl: "", price: "0", categoryId: activeCategoryId || categories[0]?.id || "", ingredientIds: [] });
  }

  function editMenuItem(item: MenuEntry) {
    const categoryId = item.categoryId || activeCategoryId || categories[0]?.id || "";
    setEditingItemId(item.id);
    setActiveCategoryId(categoryId);
    setIsDishFormOpen(true);
    setRestaurantCurrency(item.currency || restaurantCurrency);
    setForm({
      name: item.displayName,
      description: item.displayDescription,
      imageUrl: item.imageUrl ?? "",
      price: String(item.price),
      categoryId,
      ingredientIds: item.ingredients?.map((ingredient) => ingredient.id) ?? []
    });
  }

  async function deleteMenuItem(itemId: string) {
    if (!window.confirm(tt("restaurant.delete_dish_confirm", "Delete this dish?"))) return;
    await fetch(`${apiUrl}/restaurants/${restaurantId}/menu/${itemId}`, { method: "DELETE" });
    if (editingItemId === itemId) resetMenuForm();
    await loadLocalizedData(ownerLanguage);
  }

  async function addCategory(nextName = categorySearch, catalogKey?: string) {
    const name = nextName.trim();
    if (!name) return;

    const existing = categories.find((category) => (catalogKey && category.catalogKey === catalogKey) || matchesEntry(category, name));
    if (existing) {
      setActiveCategoryId(existing.id);
      setForm((current) => ({ ...current, categoryId: existing.id }));
      setShowCategorySearch(false);
      setCategorySearch("");
      return;
    }

    const response = await fetch(`${apiUrl}/restaurants/${restaurantId}/catalog/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: ownerLanguage, name, catalogKey })
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

  function chooseCategorySuggestion(category: CatalogEntry) {
    const catalogKey = category.catalogKey ?? category.id;
    const existing = categories.find((item) => item.catalogKey === catalogKey || item.id === category.id || matchesEntry(item, category.displayName));
    if (existing) {
      setActiveCategoryId(existing.id);
      setForm((current) => ({ ...current, categoryId: existing.id }));
      setShowCategorySearch(false);
      setCategorySearch("");
      return;
    }

    void addCategory(category.displayName, standardCategories.some((item) => item.id === catalogKey) ? catalogKey : category.catalogKey);
  }

  async function deleteCategory(categoryId: string) {
    if (!window.confirm(tt("restaurant.delete_section_confirm", "Delete this section? Dishes will stay saved and can be moved to another section."))) return;
    await fetch(`${apiUrl}/restaurants/${restaurantId}/catalog/categories/${categoryId}`, { method: "DELETE" });
    if (activeCategoryId === categoryId) {
      setActiveCategoryId("");
      setForm((current) => ({ ...current, categoryId: "" }));
    }
    await loadLocalizedData(ownerLanguage);
  }

  async function patchOrder(path: string, body: Record<string, unknown>) {
    await fetch(`${apiUrl}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  }

  async function selectPlan(planId: string) {
    const response = await fetch(`${apiUrl}/restaurants/${restaurantId}/plan`, {
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
        restaurantId: restaurantId,
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
    await fetch(`${apiUrl}/restaurants/${restaurantId}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: tableNumber })
    });
    setTableNumber("");
    setTables(await fetchJson(`/restaurants/${restaurantId}/tables`, [] as RestaurantTable[]));
  }

  async function saveProfile() {
    const response = await fetch(`${apiUrl}/restaurants/${restaurantId}/profile`, {
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
        city: profile.city,
        currency: restaurantCurrency,
        logoUrl: profile.logoUrl
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

  async function deleteAccount() {
    if (!window.confirm(tt("account.delete_confirm", t.deleteAccountConfirm))) return;
    const sessionId = localStorage.getItem(sessionStorageKey);
    if (!sessionId) return;

    const response = await fetch(`${apiUrl}/auth/account`, {
      method: "DELETE",
      headers: { "x-session-id": sessionId }
    });

    if (response.ok) {
      localStorage.removeItem(sessionStorageKey);
      window.location.href = "/";
    }
  }

  function openDishForm(categoryId: string) {
    setActiveCategoryId(categoryId);
    setForm((current) => ({ ...current, categoryId }));
  }

  function startAddDish(categoryId: string) {
    setEditingItemId("");
    setActiveCategoryId(categoryId);
    setIsDishFormOpen(true);
    setForm({ name: "", description: "", imageUrl: "", price: "0", categoryId, ingredientIds: [] });
    setIngredientSearch("");
  }

  function renderCurrencySettings() {
    return (
      <label className="currency-select-row">
        {tt("restaurant.currency", "Restaurant currency")}
        <input
          placeholder={tt("restaurant.currency_search", "Search currency")}
          value={currencySearch}
          onChange={(event) => setCurrencySearch(event.target.value)}
        />
        {visibleCurrencyResults.length ? (
          <div className="currency-result-list">
            {visibleCurrencyResults.map((code) => (
              <button key={code} type="button" onClick={() => void updateRestaurantCurrency(code)}>
                {currencyLabel(code, ownerLanguage)}
              </button>
            ))}
          </div>
        ) : null}
        <select value={restaurantCurrency} onChange={(event) => void updateRestaurantCurrency(event.target.value)}>
          {fallbackCurrencyCodes.map((code) => (
            <option key={code} value={code}>{currencyLabel(code, ownerLanguage)}</option>
          ))}
        </select>
      </label>
    );
  }

  function renderMenuItemForm() {
    return (
      <div className="menu-builder inline-menu-builder">
        <label>{tt("restaurant.item_name", t.itemName)}<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label>{tt("restaurant.description", t.description)}<input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <label className="file-upload-control">
          {tt("restaurant.upload_dish_image", tt("restaurant.image_url", t.imageUrl))}
          <input type="file" accept="image/*" onChange={(event) => void handleDishImageUpload(event.target.files?.[0])} />
          {form.imageUrl ? <img alt="" className="menu-image-preview" src={form.imageUrl} /> : null}
        </label>
        <label>{tt("restaurant.price", t.price)}<input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
        <label>{tt("restaurant.section", "Section")}<select value={form.categoryId} onChange={(event) => openDishForm(event.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.displayName}</option>)}</select></label>
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
        <div className="menu-form-actions">
          <button type="button" onClick={() => void saveMenuItem()}>
            {editingItemId ? tt("restaurant.save_dish", tt("common.save", t.save)) : tt("common.add", t.add)}
          </button>
          {editingItemId ? (
            <button className="muted" type="button" onClick={resetMenuForm}>{tt("restaurant.cancel_edit", t.cancel)}</button>
          ) : null}
        </div>
      </div>
    );
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
	                        onClick={() => chooseCategorySuggestion(category)}
	                      >
                        {category.displayName}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {!categories.length ? (
                <div className="menu-empty-state">
                  <strong>{tt("restaurant.empty_sections_title", t.emptySectionsTitle)}</strong>
                  <p>{tt("restaurant.empty_sections_body", t.emptySectionsBody)}</p>
                </div>
              ) : null}
	              <div className="menu-section-list">
	                {categories.map((category) => {
	                  const sectionItems = menu.filter((item) => item.categoryId === category.id);
	                  return (
	                    <article className="menu-section-card" key={category.id}>
	                      <header className="menu-section-header">
	                        <div>
	                          <h3>{category.displayName}</h3>
	                          <span>{sectionItems.length} {tt("restaurant.add_dish", t.addItemToCategory)}</span>
	                        </div>
	                        <div className="menu-section-actions">
                          <button type="button" onClick={() => startAddDish(category.id)}>+ {tt("restaurant.add_dish", t.addItemToCategory)}</button>
                          <button className="danger" type="button" onClick={() => void deleteCategory(category.id)}>{tt("restaurant.delete_section", "Delete section")}</button>
                        </div>
                      </header>
                      {isDishFormOpen && activeCategoryId === category.id ? renderMenuItemForm() : null}
                      {sectionItems.length ? (
	                        <div className="menu-dish-list">
	                          {sectionItems.map((item) => (
	                            <article className="menu-dish-card" key={item.id}>
	                              {item.imageUrl ? <img alt={item.displayName} className="menu-dish-image" src={item.imageUrl} /> : <div className="menu-dish-image placeholder">{item.displayName.slice(0, 1)}</div>}
	                              <div className="menu-dish-body">
	                                <div>
	                                  <h4>{item.displayName}</h4>
	                                  <p>{item.displayDescription}</p>
	                                </div>
	                                {item.ingredients?.length ? <span>{item.ingredients.map((ingredient) => ingredient.displayName).join(", ")}</span> : null}
	                              </div>
	                              <strong className="menu-dish-price">{item.price} {item.currency}</strong>
	                              <div className="menu-dish-actions">
	                                <button type="button" onClick={() => editMenuItem(item)}>{tt("restaurant.edit_dish", "Edit dish")}</button>
	                                <button className="danger" type="button" onClick={() => void deleteMenuItem(item.id)}>{tt("restaurant.delete_dish", "Delete dish")}</button>
	                              </div>
	                            </article>
	                          ))}
	                        </div>
	                      ) : (
	                        <p className="menu-section-empty">{tt("restaurant.no_dishes", "No dishes in this section yet.")}</p>
	                      )}
	                    </article>
	                  );
	                })}
	                {uncategorizedMenu.length ? (
	                  <article className="menu-section-card">
	                    <header className="menu-section-header">
	                      <h3>{tt("restaurant.uncategorized", "Without section")}</h3>
	                    </header>
	                    <div className="menu-dish-list">
	                      {uncategorizedMenu.map((item) => (
	                        <article className="menu-dish-card" key={item.id}>
	                          {item.imageUrl ? <img alt={item.displayName} className="menu-dish-image" src={item.imageUrl} /> : <div className="menu-dish-image placeholder">{item.displayName.slice(0, 1)}</div>}
	                          <div className="menu-dish-body">
	                            <h4>{item.displayName}</h4>
	                            <p>{item.displayDescription}</p>
	                            {item.ingredients?.length ? <span>{item.ingredients.map((ingredient) => ingredient.displayName).join(", ")}</span> : null}
	                          </div>
	                          <strong className="menu-dish-price">{item.price} {item.currency}</strong>
	                          <div className="menu-dish-actions">
	                            <button type="button" onClick={() => editMenuItem(item)}>{tt("restaurant.edit_dish", "Edit dish")}</button>
	                            <button className="danger" type="button" onClick={() => void deleteMenuItem(item.id)}>{tt("restaurant.delete_dish", "Delete dish")}</button>
	                          </div>
	                        </article>
	                      ))}
	                    </div>
	                  </article>
	                ) : null}
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
            <div className="restaurant-logo-uploader">
              <div className="restaurant-logo-preview">
                {profile.logoUrl ? <img alt={profile.name} src={profile.logoUrl} /> : <strong>{profile.name.slice(0, 1) || "S"}</strong>}
              </div>
              <label className="file-upload-control compact">
                {tt("restaurant.upload_logo", "Upload restaurant logo")}
                <input type="file" accept="image/*" onChange={(event) => void handleLogoUpload(event.target.files?.[0])} />
              </label>
            </div>
            {(["ownerFirstName", "ownerLastName", "email", "name", "phone", "address", "country", "city"] as const).map((field) => (
              <label key={field}>
                {profileLabels[field]}
                <input value={String(profile[field] ?? "")} onChange={(event) => setProfile({ ...profile, [field]: event.target.value })} />
              </label>
            ))}
            <button className="public-button primary wide" type="button" onClick={() => void saveProfile()}>{tt("common.save", t.save)}</button>
            <button className="danger-button wide" type="button" onClick={() => void deleteAccount()}>{tt("account.delete", t.deleteAccount)}</button>
          </section>
        ) : null}

        {activeTab === "settings" ? (
          <section className="owner-module-card settings-panel">
            <h2>{tt("restaurant.settings", t.settings)}</h2>
            <label className="owner-settings-control">
              {tt("restaurant.language", t.language)}
              <select value={ownerLanguage} onChange={(event) => void updateOwnerLanguage(event.target.value)}>
                {languages.map((language) => (
                  <option key={language.code} value={language.code}>{language.nativeName}</option>
                ))}
              </select>
            </label>
            {renderCurrencySettings()}
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

function searchCurrencyCodes(query: string, language: string) {
  const value = normalizeSearch(query);
  if (!value) return fallbackCurrencyCodes;
  return fallbackCurrencyCodes.filter((code) => currencySearchNames(code, language).some((name) => normalizeSearch(name).includes(value)));
}

function currencyLabel(code: string, language = "en") {
  const name = currencyDisplayNames[code]?.[language] ?? currencyDisplayNames[code]?.en ?? currencyDisplayNames[code]?.ar;
  return name ? `${code} - ${name}` : code;
}

function currencySearchNames(code: string, language: string) {
  const names = currencyDisplayNames[code] ?? {};
  return [code, names[language], names.en, names.ar, ...Object.values(names)].filter(Boolean) as string[];
}

function normalizeSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\bال(?=\p{Letter})/gu, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ");
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}
