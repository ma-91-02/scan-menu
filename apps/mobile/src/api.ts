import { Platform } from "react-native";

interface ApiResponse<T> {
  data: T;
}

export interface Restaurant {
  id: string;
  name: string;
  operatingLanguage: string;
  supportedCustomerLanguages: string[];
  status: "draft" | "active" | "paused";
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: Record<string, string>;
  description: Record<string, string>;
  price: number;
  currency: "USD" | "EUR" | "RUB" | "SAR" | "AED";
  isAvailable: boolean;
}

export interface Order {
  id: string;
  restaurantId: string;
  customerId: string;
  customerLanguage: string;
  restaurantLanguage: string;
  status: string;
  lines: Array<{
    menuItemId: string;
    quantity: number;
    customerNote?: string;
    restaurantNote?: string;
    customerItemName?: string;
    restaurantItemName?: string;
  }>;
  total: number;
  currency: MenuItem["currency"];
  createdAt: string;
}

export const supportedLanguages: Array<{
  code: string;
  nativeName: string;
  direction: "ltr" | "rtl";
}> = [
  { code: "ar", nativeName: "العربية", direction: "rtl" },
  { code: "en", nativeName: "English", direction: "ltr" },
  { code: "ru", nativeName: "Русский", direction: "ltr" },
  { code: "tr", nativeName: "Türkçe", direction: "ltr" },
  { code: "fr", nativeName: "Français", direction: "ltr" },
  { code: "es", nativeName: "Español", direction: "ltr" }
];

export type CustomerMenuItem = MenuItem & {
  displayName: string;
  displayDescription: string;
};

export type CustomerOrder = Order & {
  displayLines?: Array<Order["lines"][number] & { displayName?: string; displayNote?: string }>;
};

export interface CustomerUser {
  id: string;
  name: string;
  email?: string;
  preferredLanguage?: string;
}

const localApiUrl = Platform.OS === "android" ? "http://10.0.2.2:4001" : "http://localhost:4001";

export const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? localApiUrl;

export const fallbackRestaurants: Restaurant[] = [
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

export const fallbackMenu: CustomerMenuItem[] = [
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
    displayName: "وعاء السلمون",
    displayDescription: "أرز، سلمون، أفوكادو، خيار، سمسم.",
    price: 18,
    currency: "USD",
    isAvailable: true
  }
];

async function fetchData<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${apiUrl}${path}`);

    if (!response.ok) {
      return fallback;
    }

    const payload = (await response.json()) as ApiResponse<T>;
    return payload.data;
  } catch {
    return fallback;
  }
}

export async function getLanguages() {
  return fetchData("/translations/languages", supportedLanguages);
}

export async function getRestaurants() {
  return fetchData("/restaurants", fallbackRestaurants);
}

export async function getMenu(restaurantId: string, language: string) {
  return fetchData(`/restaurants/${restaurantId}/menu?language=${language}`, fallbackMenu);
}

export async function createOrder(input: {
  restaurantId: string;
  customerId: string;
  customerLanguage: string;
  restaurantLanguage: string;
  cart: Record<string, number>;
  note?: string;
}) {
  const lines = Object.entries(input.cart)
    .filter(([, quantity]) => quantity > 0)
    .map(([menuItemId, quantity]) => ({
      menuItemId,
      quantity,
      customerNote: input.note
    }));

  const response = await fetch(`${apiUrl}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      restaurantId: input.restaurantId,
      customerId: input.customerId,
      customerLanguage: input.customerLanguage,
      restaurantLanguage: input.restaurantLanguage,
      lines
    })
  });

  const payload = (await response.json()) as ApiResponse<CustomerOrder>;

  if (!response.ok) {
    throw new Error("Order failed");
  }

  return payload.data;
}

export async function registerCustomer(input: {
  name: string;
  email: string;
  username: string;
  preferredLanguage: string;
}) {
  const response = await fetch(`${apiUrl}/auth/register/customer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  const payload = (await response.json()) as ApiResponse<{ user: CustomerUser }>;

  if (!response.ok) {
    throw new Error("Registration failed");
  }

  return payload.data.user;
}

export async function loginCustomer(input: { identifier: string; password: string }) {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  const payload = (await response.json()) as ApiResponse<{ user: CustomerUser & { role: string } }>;

  if (!response.ok || payload.data.user.role !== "customer") {
    throw new Error("Login failed");
  }

  return payload.data.user;
}
