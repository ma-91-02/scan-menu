import type { ApiResponse, LocalizedPublicPageContent, MenuItem, Order, PublicPageContent } from "@scan-menu/shared";
import { supportedLanguages } from "@scan-menu/shared";

export const apiUrl = process.env.WEB_PUBLIC_API_URL ?? "http://localhost:4001";

const fallbackOrders: Order[] = [
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
        customerNote: "بدون بصل",
        restaurantNote: "без лука"
      }
    ],
    total: 18,
    currency: "USD",
    createdAt: new Date().toISOString()
  }
];

const fallbackMenu: Array<MenuItem & { displayName: string; displayDescription: string }> = [
  {
    id: "mi_salmon_bowl",
    restaurantId: "rst_bistro_01",
    name: { en: "Salmon Bowl", ar: "وعاء السلمون", ru: "Боул с лососем" },
    description: {
      en: "Rice, salmon, avocado, cucumber, sesame.",
      ar: "أرز، سلمون، أفوكادو، خيار، سمسم.",
      ru: "Рис, лосось, авокадо, огурец, кунжут."
    },
    displayName: "وعاء السلمون",
    displayDescription: "أرز، سلمون، أفوكادو، خيار، سمسم.",
    price: 18,
    currency: "USD",
    isAvailable: true
  }
];

const fallbackPublicPage: LocalizedPublicPageContent = {
  id: "public-home",
  brandName: "Scan Menu",
  nav: {
    home: "Home",
    pricing: "Pricing",
    about: "About",
    login: "Login",
    registration: "Registration",
    restaurant: "Your Restaurant"
  },
  hero: {
    eyebrow: "Multilingual restaurant platform",
    title: "Let every guest order in their language, while your restaurant receives it in yours.",
    subtitle:
      "Scan Menu connects guests and restaurants with central translation, menu management, live orders, and roles for staff, accountants, and owners.",
    primaryAction: "Start your restaurant",
    secondaryAction: "Explore features",
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80"
  },
  featureCards: [],
  pricing: [],
  about: {
    title: "Scan Menu is an operating system for restaurants.",
    body: "The platform owner controls public content, languages, pricing, and restaurant-facing areas from the dashboard."
  },
  restaurantPortal: {
    title: "Your restaurant area",
    menuItems: ["Profile", "Menu", "Employees", "Kitchen", "Languages", "Finance"]
  },
  language: "en",
  direction: "ltr",
  updatedAt: new Date().toISOString()
};

const fallbackRawPublicPage: PublicPageContent = {
  id: "public-home",
  brandName: { ar: "Scan Menu", en: "Scan Menu", ru: "Scan Menu" },
  nav: {
    home: { ar: "الرئيسية", en: "Home", ru: "Главная" },
    pricing: { ar: "الأسعار", en: "Pricing", ru: "Цена" },
    about: { ar: "من نحن", en: "About", ru: "О нас" },
    login: { ar: "دخول", en: "Login", ru: "Войти" },
    registration: { ar: "تسجيل", en: "Registration", ru: "Регистрация" },
    restaurant: { ar: "مطعمك", en: "Your Restaurant", ru: "Твой ресторан" }
  },
  hero: {
    eyebrow: { ar: "منصة مطاعم متعددة اللغات", en: "Multilingual restaurant platform" },
    title: {
      ar: "اجعل كل زائر يطلب بلغته، واجعل مطعمك يستقبل الطلب بلغته.",
      en: "Let every guest order in their language, while your restaurant receives it in yours."
    },
    subtitle: {
      ar: "تحكم مركزي بالمحتوى واللغات والطلبات.",
      en: "Central control for content, languages, and orders."
    },
    primaryAction: { ar: "ابدأ لمطعمك", en: "Start your restaurant" },
    secondaryAction: { ar: "شاهد المزايا", en: "Explore features" },
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80"
  },
  featureCards: [],
  pricing: [],
  about: {
    title: { ar: "نظام تشغيل للمطاعم", en: "Operating system for restaurants" },
    body: { ar: "محتوى الصفحة يدار من لوحة التحكم.", en: "Public content is managed from dashboard." }
  },
  restaurantPortal: {
    title: { ar: "منطقة مطعمك", en: "Your restaurant area" },
    menuItems: [{ ar: "القائمة", en: "Menu" }, { ar: "الموظفون", en: "Employees" }]
  },
  updatedAt: new Date().toISOString()
};

async function fetchData<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      cache: "no-store",
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = (await response.json()) as ApiResponse<T>;
    return payload.data;
  } catch {
    return fallback;
  }
}

export async function getDashboardData() {
  const [languages, orders, menu] = await Promise.all([
    fetchData("/translations/languages", supportedLanguages),
    fetchData("/orders", fallbackOrders),
    fetchData("/restaurants/rst_bistro_01/menu?language=ar", fallbackMenu)
  ]);

  return {
    languages,
    orders,
    menu,
    apiUrl
  };
}

export async function getPublicPage(language: string) {
  return fetchData(`/translations/public-page?language=${language}`, {
    ...fallbackPublicPage,
    language
  });
}

export async function getRawPublicPage() {
  return fetchData("/translations/public-page/raw", fallbackRawPublicPage);
}

export function languageLabel(language: string) {
  return supportedLanguages.find((item) => item.code === language)?.nativeName ?? language;
}
