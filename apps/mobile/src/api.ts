import { Platform } from "react-native";
import { supportedLanguages as sharedSupportedLanguages } from "@scanmenu/shared";

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
  displayName: string;
  displayDescription: string;
  price: number;
  currency: "USD" | "EUR" | "RUB" | "SAR" | "AED";
  isAvailable: boolean;
  categoryId?: string;
  ingredientIds?: string[];
  ingredients?: Array<{
    id: string;
    displayName: string;
    name: Record<string, string>;
  }>;
}

export interface OrderLine {
  menuItemId: string;
  quantity: number;
  customerNote?: string;
  restaurantNote?: string;
  customerItemName?: string;
  restaurantItemName?: string;
  displayName?: string;
  displayNote?: string;
}

export interface CustomerOrder {
  id: string;
  restaurantId: string;
  customerId: string;
  customerLanguage: string;
  restaurantLanguage: string;
  status: string;
  lines: OrderLine[];
  displayLines?: OrderLine[];
  total: number;
  currency: MenuItem["currency"];
  createdAt: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  email?: string;
  role?: string;
  preferredLanguage?: string;
}

export interface CustomerSession {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuthResult {
  user: CustomerUser;
  session?: CustomerSession;
  accessToken?: string;
}

export const supportedLanguages = sharedSupportedLanguages;

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

export const fallbackMenu: MenuItem[] = [
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
    displayName: "Salmon Bowl",
    displayDescription: "Rice, salmon, avocado, cucumber, sesame.",
    price: 18,
    currency: "USD",
    isAvailable: true
  }
];

const localCandidates = Platform.OS === "android"
  ? ["http://10.0.2.2:4000", "http://10.0.2.2:4001"]
  : ["http://localhost:4000", "http://127.0.0.1:4000", "http://localhost:4001"];

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;
const apiCandidates = Array.from(new Set(configuredApiUrl ? [configuredApiUrl, ...localCandidates] : localCandidates));
const requestTimeoutMs = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? 4500);
let activeApiUrl = apiCandidates[0]!;

export function getApiUrl() {
  return activeApiUrl;
}

async function requestData<T>(path: string, options?: RequestInit): Promise<T> {
  let lastError: unknown;

  for (const candidate of getPrioritizedApiCandidates()) {
    try {
      const response = await fetchWithTimeout(`${candidate}${path}`, options);
      const payload = (await response.json().catch(() => ({}))) as ApiResponse<T> & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? `Request failed: ${response.status}`);
      }

      activeApiUrl = candidate;
      return payload.data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("API is unavailable");
}

function getPrioritizedApiCandidates() {
  return [activeApiUrl, ...apiCandidates.filter((candidate) => candidate !== activeApiUrl)];
}

async function fetchWithTimeout(url: string, options?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchData<T>(path: string, fallback: T): Promise<T> {
  try {
    return await requestData<T>(path);
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

export async function getRestaurant(restaurantId: string) {
  return fetchData(`/restaurants/${restaurantId}`, fallbackRestaurants.find((item) => item.id === restaurantId) ?? fallbackRestaurants[0]!);
}

export async function getMenu(restaurantId: string, language: string) {
  return fetchData(`/restaurants/${restaurantId}/menu?language=${encodeURIComponent(language)}`, fallbackMenu);
}

export async function getCustomerOrders(customerId: string, language: string) {
  return fetchData<CustomerOrder[]>(
    `/orders?customerId=${encodeURIComponent(customerId)}&language=${encodeURIComponent(language)}`,
    []
  );
}

export async function createOrder(input: {
  restaurantId: string;
  customerId: string;
  customerLanguage: string;
  restaurantLanguage: string;
  cart: Record<string, number>;
  removedIngredientIdsByItem?: Record<string, string[]>;
  note?: string;
  tableNumber?: string;
  paymentMethod?: "cash" | "card";
}) {
  const note = [input.note, input.tableNumber ? `table ${input.tableNumber}` : ""].filter(Boolean).join("; ");
  const lines = Object.entries(input.cart)
    .filter(([, quantity]) => quantity > 0)
    .map(([menuItemId, quantity]) => ({
      menuItemId,
      quantity,
      customerNote: note || undefined,
      removedIngredientIds: input.removedIngredientIdsByItem?.[menuItemId] ?? []
    }));

  return requestData<CustomerOrder>("/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      restaurantId: input.restaurantId,
      customerId: input.customerId,
      customerLanguage: input.customerLanguage,
      restaurantLanguage: input.restaurantLanguage,
      tableNumber: input.tableNumber,
      paymentMethod: input.paymentMethod ?? "cash",
      lines
    })
  });
}

export async function requestWaiter(input: {
  restaurantId: string;
  customerId: string;
  customerLanguage: string;
  restaurantLanguage: string;
  tableNumber?: string;
}) {
  return requestData<CustomerOrder>("/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      restaurantId: input.restaurantId,
      customerId: input.customerId,
      customerLanguage: input.customerLanguage,
      restaurantLanguage: input.restaurantLanguage,
      lines: [
        {
          menuItemId: "waiter_request",
          quantity: 1,
          customerNote: input.tableNumber ? `waiter; table ${input.tableNumber}` : "waiter"
        }
      ],
      tableNumber: input.tableNumber
    })
  });
}

export async function registerCustomer(input: {
  name: string;
  email: string;
  username: string;
  password?: string;
  preferredLanguage: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  consentAt: string;
}) {
  const data = await requestData<AuthResult>("/auth/register/customer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  if (data.user.role && data.user.role !== "customer") {
    throw new Error("This account is not a customer account");
  }

  return data;
}

export async function loginCustomer(input: { identifier: string; password: string }) {
  const data = await requestData<AuthResult>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  if (data.user.role !== "customer") {
    throw new Error("This account is not a customer account");
  }

  return data;
}

export async function logoutCustomer(sessionId?: string) {
  if (!sessionId) {
    return { ok: true };
  }

  return requestData<{ ok: boolean }>("/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId })
  });
}
