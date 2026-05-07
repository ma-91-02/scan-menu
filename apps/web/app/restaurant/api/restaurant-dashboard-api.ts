import { supportedLanguages } from "@scanmenu/shared";
import type {
  CatalogEntry,
  MenuEntry,
  MenuFormState,
  Plan,
  RestaurantOrder,
  RestaurantProfile,
  RestaurantTable,
  StaffFormState,
  StaffUser,
} from "../types";
import { sessionStorageKey } from "../data/default-restaurant-data";

export const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface BootstrapPayload {
  languages: typeof supportedLanguages;
  profile: RestaurantProfile;
  plans: Plan[];
  restaurantId: string;
  role?: string;
  staff: StaffUser[];
  tables: RestaurantTable[];
}

export interface LocalizedRestaurantPayload {
  categories: CatalogEntry[];
  ingredients: CatalogEntry[];
  menu: MenuEntry[];
  orders: RestaurantOrder[];
  standardCategories: CatalogEntry[];
}

export async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${apiUrl}${path}`);
    const payload = await response.json();
    return response.ok ? (payload.data ?? fallback) : fallback;
  } catch {
    return fallback;
  }
}

export async function loadSession() {
  const sessionId = localStorage.getItem(sessionStorageKey);
  if (!sessionId) return null;
  try {
    const response = await fetch(`${apiUrl}/auth/session/${sessionId}`);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export function sessionHeader(): Record<string, string> {
  const sessionId = localStorage.getItem(sessionStorageKey);
  return sessionId ? { "x-session-id": sessionId } : {};
}

export async function fetchStaff(nextRestaurantId: string) {
  const sessionId = localStorage.getItem(sessionStorageKey);
  if (!sessionId) return [] as StaffUser[];

  try {
    const response = await fetch(
      `${apiUrl}/auth/restaurants/${nextRestaurantId}/staff`,
      {
        headers: { "x-session-id": sessionId },
      },
    );
    const payload = await response.json();
    return response.ok ? (payload.data ?? []) : [];
  } catch {
    return [];
  }
}

export async function fetchBootstrapData(
  fallbackRestaurantId: string,
  fallbackProfile: RestaurantProfile,
): Promise<BootstrapPayload> {
  const session = await loadSession();
  const sessionUser = session?.data?.user;
  const restaurantId = sessionUser?.restaurantId
    ? String(sessionUser.restaurantId)
    : fallbackRestaurantId;
  const role = sessionUser?.staffRole ?? sessionUser?.role;

  const [languages, profile, plans, tables, staff] = await Promise.all([
    fetchJson("/translations/languages", supportedLanguages),
    fetchJson(`/restaurants/${restaurantId}`, {
      ...fallbackProfile,
      id: restaurantId,
    }),
    fetchJson("/restaurants/plans", [] as Plan[]),
    fetchJson(`/restaurants/${restaurantId}/tables`, [] as RestaurantTable[]),
    fetchStaff(restaurantId),
  ]);

  return {
    languages,
    profile,
    plans,
    restaurantId,
    role: role ? String(role) : undefined,
    staff,
    tables,
  };
}

export async function fetchLocalizedRestaurantData(
  restaurantId: string,
  language: string,
): Promise<LocalizedRestaurantPayload> {
  const [categories, standardCategories, ingredients, menu, orders] =
    await Promise.all([
      fetchJson(
        `/restaurants/${restaurantId}/catalog/categories?language=${language}`,
        [] as CatalogEntry[],
      ),
      fetchJson(`/translations/sections/${language}`, [] as CatalogEntry[]),
      fetchJson(`/translations/ingredients/${language}`, [] as CatalogEntry[]),
      fetchJson(
        `/restaurants/${restaurantId}/menu?language=${language}`,
        [] as MenuEntry[],
      ),
      fetchJson(
        `/orders?restaurantId=${restaurantId}&language=${language}`,
        [] as RestaurantOrder[],
      ),
    ]);

  return {
    categories,
    ingredients,
    menu,
    orders,
    standardCategories,
  };
}

export async function updateRestaurantLanguage(
  restaurantId: string,
  operatingLanguage: string,
) {
  await fetch(`${apiUrl}/restaurants/${restaurantId}/language`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operatingLanguage }),
  }).catch(() => undefined);
}

export async function updateRestaurantProfile(
  restaurantId: string,
  body: Record<string, unknown>,
) {
  const response = await fetch(
    `${apiUrl}/restaurants/${restaurantId}/profile`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const payload = await response.json().catch(() => null);
  return response.ok ? payload?.data : null;
}

export async function saveRestaurantMenuItem(
  restaurantId: string,
  editingItemId: string,
  body: Record<string, unknown>,
) {
  const path = editingItemId
    ? `${apiUrl}/restaurants/${restaurantId}/menu/${editingItemId}`
    : `${apiUrl}/restaurants/${restaurantId}/menu`;
  await fetch(path, {
    method: editingItemId ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteRestaurantMenuItem(
  restaurantId: string,
  itemId: string,
) {
  await fetch(`${apiUrl}/restaurants/${restaurantId}/menu/${itemId}`, {
    method: "DELETE",
  });
}

export async function createRestaurantCategory(
  restaurantId: string,
  body: Record<string, unknown>,
) {
  const response = await fetch(
    `${apiUrl}/restaurants/${restaurantId}/catalog/categories`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const payload = await response.json().catch(() => null);
  return response.ok ? payload?.data : null;
}

export async function deleteRestaurantCategory(
  restaurantId: string,
  categoryId: string,
) {
  await fetch(
    `${apiUrl}/restaurants/${restaurantId}/catalog/categories/${categoryId}`,
    { method: "DELETE" },
  );
}

export async function patchRestaurantOrder(
  path: string,
  body: Record<string, unknown>,
) {
  await fetch(`${apiUrl}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function selectRestaurantPlan(
  restaurantId: string,
  planId: string,
) {
  const response = await fetch(`${apiUrl}/restaurants/${restaurantId}/plan`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId }),
  });
  const payload = await response.json().catch(() => null);
  return response.ok ? payload?.data?.restaurant : null;
}

export async function createRestaurantStaff(
  restaurantId: string,
  restaurantName: string,
  preferredLanguage: string,
  staffForm: StaffFormState,
) {
  await fetch(`${apiUrl}/auth/register/staff`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...sessionHeader() },
    body: JSON.stringify({
      ...staffForm,
      restaurantId,
      restaurantName,
      preferredLanguage,
    }),
  });
}

export async function createRestaurantTable(
  restaurantId: string,
  number: string,
) {
  await fetch(`${apiUrl}/restaurants/${restaurantId}/tables`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ number }),
  });
}

export async function logoutRestaurantSession() {
  const sessionId = localStorage.getItem(sessionStorageKey);
  if (sessionId) {
    await fetch(`${apiUrl}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(() => undefined);
  }
  localStorage.removeItem(sessionStorageKey);
}

export async function deleteRestaurantAccount() {
  const sessionId = localStorage.getItem(sessionStorageKey);
  if (!sessionId) return false;

  const response = await fetch(`${apiUrl}/auth/account`, {
    method: "DELETE",
    headers: { "x-session-id": sessionId },
  });

  if (response.ok) {
    localStorage.removeItem(sessionStorageKey);
  }

  return response.ok;
}

export function buildMenuItemPayload(
  form: MenuFormState,
  language: string,
  currency: string,
) {
  return {
    language,
    categoryId: form.categoryId,
    ingredientIds: form.ingredientIds,
    name: form.name,
    description: form.description,
    imageUrl: form.imageUrl,
    price: Number(form.price) || 0,
    currency,
  };
}
