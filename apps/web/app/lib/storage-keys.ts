"use client";

export const storageKeys = {
  session: "babili-session",
  language: "babili-language",
  customerLanguage: "babili-customer-language",
  customerUser: "babili-customer-user",
} as const;

const legacyStorageKeys: Record<keyof typeof storageKeys, string> = {
  session: "scanmenu-session",
  language: "scanmenu-language",
  customerLanguage: "scanmenu-customer-language",
  customerUser: "scanmenu-customer-user",
};

export function migrateLegacyStorageKey(key: keyof typeof storageKeys) {
  const currentKey = storageKeys[key];
  const legacyKey = legacyStorageKeys[key];
  const currentValue = localStorage.getItem(currentKey);
  const legacyValue = localStorage.getItem(legacyKey);

  if (!currentValue && legacyValue) {
    localStorage.setItem(currentKey, legacyValue);
    localStorage.removeItem(legacyKey);
  }

  return currentKey;
}
