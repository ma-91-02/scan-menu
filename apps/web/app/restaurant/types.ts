import type { SupportedLanguage } from "@scanmenu/shared";

export type TabId =
  | "menu"
  | "cashier"
  | "kitchen"
  | "employees"
  | "tables"
  | "plans"
  | "profile"
  | "settings";

export type TextLookup = (key: string) => string;

export interface RestaurantTab {
  id: TabId;
  label: string;
}

export interface CatalogEntry {
  id: string;
  catalogKey?: string;
  name?: Record<string, string>;
  translations?: Record<string, string>;
  displayName: string;
}

export interface MenuEntry {
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

export interface RestaurantOrderLine {
  menuItemId: string;
  quantity: number;
  displayName?: string;
  displayNote?: string;
  displayIngredients?: string[];
  displayRemovedIngredients?: string[];
  kitchenStatus?: "pending" | "preparing" | "ready";
}

export interface RestaurantOrder {
  id: string;
  tableNumber?: string;
  status: string;
  total: number;
  currency: string;
  paymentMethod?: "cash" | "card";
  paymentStatus?: "paid" | "unpaid";
  type?: "order" | "waiter_request";
  displayLines?: RestaurantOrderLine[];
}

export interface Plan {
  id: "basic" | "standard" | "premium" | "gold";
  name: string;
  priceMonthly: number;
  features: string[];
}

export interface RestaurantProfile {
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

export interface RestaurantTable {
  id: string;
  number: string;
  qrPath: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  permissions?: string[];
}

export interface MenuFormState {
  name: string;
  description: string;
  imageUrl: string;
  price: string;
  categoryId: string;
  ingredientIds: string[];
}

export interface StaffFormState {
  name: string;
  email: string;
  username: string;
  role: string;
}

export type LanguageList = SupportedLanguage[];
