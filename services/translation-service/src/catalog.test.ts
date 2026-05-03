import assert from "node:assert/strict";
import test from "node:test";
import {
  allergenTaxonomy,
  ingredientTaxonomy,
  modifierTaxonomy,
  scanMenuLanguages,
  uiTranslations
} from "@scanmenu/shared";

const requiredLanguageCodes = [
  "ar",
  "en",
  "ru",
  "tr",
  "fr",
  "es",
  "de",
  "it",
  "pt",
  "zh",
  "ja",
  "ko",
  "hi",
  "ur",
  "fa",
  "he",
  "id",
  "ms",
  "uk",
  "pl",
  "nl",
  "sv",
  "el",
  "vi",
  "th"
];

function assertCompleteTranslations(collection: Array<{ translations: Record<string, string> }>) {
  for (const item of collection) {
    for (const language of requiredLanguageCodes) {
      const value = item.translations[language];
      assert.equal(typeof value, "string");
      assert.ok((value ?? "").trim().length > 0);
    }
  }
}

test("supported language list contains every required language", () => {
  assert.deepEqual(scanMenuLanguages.map((language) => language.code), requiredLanguageCodes);
});

test("rtl languages are marked correctly", () => {
  const rtlLanguages = scanMenuLanguages.filter((language) => language.direction === "rtl").map((language) => language.code);
  assert.deepEqual(rtlLanguages, ["ar", "ur", "fa", "he"]);
});

test("each UI translation key includes all required languages", () => {
  assertCompleteTranslations(uiTranslations);
});

test("each ingredient includes all required languages", () => {
  assertCompleteTranslations(ingredientTaxonomy);
});

test("each modifier includes all required languages", () => {
  assertCompleteTranslations(modifierTaxonomy);
});

test("each allergen includes all required languages", () => {
  assertCompleteTranslations(allergenTaxonomy);
});
