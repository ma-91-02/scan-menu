import type { CatalogEntry, TabId } from "./types";

export function canSeeTab(role: string, tab: TabId) {
  if (role === "kitchen") return tab === "kitchen";
  if (role === "cashier") return tab === "cashier";
  if (role === "waiter") return tab === "cashier";
  if (role === "viewer") return ["menu", "kitchen", "cashier"].includes(tab);
  if (role === "manager") return tab !== "plans" && tab !== "profile";
  return true;
}

export function defaultTabForRole(role: string): TabId {
  if (role === "kitchen") return "kitchen";
  if (role === "cashier" || role === "waiter") return "cashier";
  return "menu";
}

export function matchesEntry(entry: CatalogEntry, query: string) {
  const value = query.trim().toLowerCase();
  return Object.values(
    entry.name ?? entry.translations ?? { en: entry.displayName },
  ).some((name) => String(name).toLowerCase().includes(value));
}

export function searchEntries(entries: CatalogEntry[], query: string) {
  const value = query.trim();
  if (!value) return entries;
  return entries.filter((entry) => matchesEntry(entry, value));
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}
