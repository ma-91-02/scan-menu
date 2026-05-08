export type LanguageCode =
  | "ar"
  | "en"
  | "ru"
  | "tr"
  | "fr"
  | "es"
  | "de"
  | "it"
  | "pt"
  | "zh"
  | "ja"
  | "ko"
  | "hi"
  | "ur"
  | "fa"
  | "he"
  | "id"
  | "ms"
  | "uk"
  | "pl"
  | "nl"
  | "sv"
  | "el"
  | "vi"
  | "th";

export type LocalizedText = Partial<Record<string, string>>;

export type UserRole =
  | "platform_owner"
  | "platform_admin"
  | "support_agent"
  | "finance_admin"
  | "translation_manager"
  | "restaurant_owner"
  | "accountant"
  | "staff"
  | StaffRole
  | "customer"
  | "delivery_partner"
  | "farmer_partner"
  | "supplier_partner";

export type StaffRole =
  | "owner"
  | "manager"
  | "cashier"
  | "kitchen"
  | "waiter"
  | "viewer";

export type OrderStatus =
  | "draft"
  | "placed"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId?: string;
  ingredientIds?: string[];
  name: LocalizedText;
  description: LocalizedText;
  imageUrl?: string;
  price: number;
  currency: string;
  isAvailable: boolean;
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  catalogKey?: string;
  name: LocalizedText;
}

export interface Ingredient {
  id: string;
  restaurantId: string;
  name: LocalizedText;
}

export interface Restaurant {
  id: string;
  name: string;
  operatingLanguage: LanguageCode | string;
  currency?: string;
  logoUrl?: string;
  supportedCustomerLanguages: Array<LanguageCode | string>;
  status: "draft" | "active" | "paused";
}

export interface OrderLine {
  menuItemId: string;
  quantity: number;
  customerItemName?: string;
  restaurantItemName?: string;
  customerNote?: string;
  restaurantNote?: string;
  ingredientNames?: LocalizedText[];
  removedIngredientIds?: string[];
  removedIngredientNames?: LocalizedText[];
  customerRemovedIngredients?: string[];
  restaurantRemovedIngredients?: string[];
  kitchenStatus?: "pending" | "preparing" | "ready";
}

export interface Order {
  id: string;
  restaurantId: string;
  customerId: string;
  tableNumber?: string;
  customerLanguage: LanguageCode | string;
  restaurantLanguage: LanguageCode | string;
  status: OrderStatus;
  paymentMethod?: "cash" | "card";
  paymentStatus?: "paid" | "unpaid";
  type?: "order" | "waiter_request";
  lines: OrderLine[];
  total: number;
  currency: MenuItem["currency"];
  createdAt: string;
}

export interface SubscriptionPlan {
  id: "basic" | "standard" | "premium" | "gold";
  name: string;
  priceMonthly: number;
  features: string[];
  limits: {
    menuItems: number | "unlimited";
    tables: number | "unlimited";
    branches: number | "unlimited";
  };
}

export interface PublicPageContent {
  id: "public-home";
  brandName: LocalizedText;
  nav: {
    home: LocalizedText;
    pricing: LocalizedText;
    about: LocalizedText;
    login: LocalizedText;
    registration: LocalizedText;
    restaurant: LocalizedText;
  };
  hero: {
    eyebrow: LocalizedText;
    title: LocalizedText;
    subtitle: LocalizedText;
    primaryAction: LocalizedText;
    secondaryAction: LocalizedText;
    imageUrl: string;
  };
  featureCards: Array<{
    id: string;
    title: LocalizedText;
    description: LocalizedText;
    imageUrl: string;
  }>;
  pricing: Array<{
    id: string;
    name: LocalizedText;
    price: LocalizedText;
    features: LocalizedText[];
  }>;
  about: {
    title: LocalizedText;
    body: LocalizedText;
  };
  restaurantPortal: {
    title: LocalizedText;
    menuItems: LocalizedText[];
  };
  updatedAt: string;
}

export interface LocalizedPublicPageContent {
  id: PublicPageContent["id"];
  brandName: string;
  nav: Record<keyof PublicPageContent["nav"], string>;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryAction: string;
    secondaryAction: string;
    imageUrl: string;
  };
  featureCards: Array<{
    id: string;
    title: string;
    description: string;
    imageUrl: string;
  }>;
  pricing: Array<{
    id: string;
    name: string;
    price: string;
    features: string[];
  }>;
  about: {
    title: string;
    body: string;
  };
  restaurantPortal: {
    title: string;
    menuItems: string[];
  };
  language: LanguageCode | string;
  direction: "ltr" | "rtl";
  updatedAt: string;
}

export interface SupportedLanguage {
  code: LanguageCode | string;
  nativeName: string;
  direction: "ltr" | "rtl";
}

export const supportedLanguages: SupportedLanguage[] = [
  { code: "ar", nativeName: "العربية", direction: "rtl" },
  { code: "en", nativeName: "English", direction: "ltr" },
  { code: "ru", nativeName: "Русский", direction: "ltr" },
  { code: "tr", nativeName: "Türkçe", direction: "ltr" },
  { code: "fr", nativeName: "Français", direction: "ltr" },
  { code: "es", nativeName: "Español", direction: "ltr" },
  { code: "de", nativeName: "Deutsch", direction: "ltr" },
  { code: "it", nativeName: "Italiano", direction: "ltr" },
  { code: "pt", nativeName: "Português", direction: "ltr" },
  { code: "zh", nativeName: "中文", direction: "ltr" },
  { code: "ja", nativeName: "日本語", direction: "ltr" },
  { code: "ko", nativeName: "한국어", direction: "ltr" },
  { code: "hi", nativeName: "हिन्दी", direction: "ltr" },
  { code: "ur", nativeName: "اردو", direction: "rtl" },
  { code: "fa", nativeName: "فارسی", direction: "rtl" },
  { code: "he", nativeName: "עברית", direction: "rtl" },
  { code: "id", nativeName: "Bahasa Indonesia", direction: "ltr" },
  { code: "ms", nativeName: "Bahasa Melayu", direction: "ltr" },
  { code: "uk", nativeName: "Українська", direction: "ltr" },
  { code: "pl", nativeName: "Polski", direction: "ltr" },
  { code: "nl", nativeName: "Nederlands", direction: "ltr" },
  { code: "sv", nativeName: "Svenska", direction: "ltr" },
  { code: "el", nativeName: "Ελληνικά", direction: "ltr" },
  { code: "vi", nativeName: "Tiếng Việt", direction: "ltr" },
  { code: "th", nativeName: "ไทย", direction: "ltr" },
];

export function pickLocalizedText(
  text: LocalizedText,
  preferredLanguage: LanguageCode | string,
  fallbackLanguage: LanguageCode | string = "en",
) {
  const value =
    text[preferredLanguage as LanguageCode] ??
    text[fallbackLanguage as LanguageCode] ??
    Object.values(text)[0] ??
    "";
  return cleanLegacyFallbackMarker(value);
}

function cleanLegacyFallbackMarker(value: string) {
  return value.replace(/^\[[a-z]{2}\]\s+/i, "");
}
export * from "./translation-catalog.js";
export {
  getRestaurantPageCopy,
  getUiTranslationMap,
  restaurantPageTranslationKeys,
} from "./translation-catalog.js";
export * from "./translation-coverage-validator.js";
