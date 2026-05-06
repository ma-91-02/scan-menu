import assert from "node:assert/strict";
import test from "node:test";
import {
  allergenTaxonomy,
  ingredientTaxonomy,
  menuSectionTaxonomy,
  modifierTaxonomy,
  scanMenuLanguages,
  TranslationCoverageValidator,
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

const validator = new TranslationCoverageValidator(scanMenuLanguages);

test("supported language list contains every required language", () => {
  assert.deepEqual(scanMenuLanguages.map((language) => language.code), requiredLanguageCodes);
  assert.deepEqual(validator.validateLanguages(scanMenuLanguages), { ok: true, issues: [] });
});

test("rtl languages are marked correctly", () => {
  const rtlLanguages = scanMenuLanguages.filter((language) => language.direction === "rtl").map((language) => language.code);
  assert.deepEqual(rtlLanguages, ["ar", "ur", "fa", "he"]);
});

test("each UI translation key includes all required languages", () => {
  assertCompleteTranslations(uiTranslations);
  assert.deepEqual(validator.validateDictionary(uiTranslations), { ok: true, issues: [] });
});

test("each ingredient includes all required languages", () => {
  assertCompleteTranslations(ingredientTaxonomy);
  assert.deepEqual(validator.validateIngredientTaxonomy(ingredientTaxonomy), { ok: true, issues: [] });
});

test("each modifier includes all required languages", () => {
  assertCompleteTranslations(modifierTaxonomy);
  assert.deepEqual(validator.validateModifierTaxonomy(modifierTaxonomy), { ok: true, issues: [] });
});

test("each allergen includes all required languages", () => {
  assertCompleteTranslations(allergenTaxonomy);
  assert.deepEqual(validator.validateAllergenTaxonomy(allergenTaxonomy), { ok: true, issues: [] });
});

test("each menu section includes all required languages", () => {
  assertCompleteTranslations(menuSectionTaxonomy);
  assert.ok(menuSectionTaxonomy.some((section) => section.id === "hot_drinks"));
  assert.ok(menuSectionTaxonomy.some((section) => section.id === "grills"));
  assert.ok(menuSectionTaxonomy.some((section) => section.id === "pizza"));
});

test("TranslationCoverageValidator fails when a required language is missing", () => {
  const result = validator.validateDictionary([
    {
      key: "test.missing_language",
      translations: { en: "Only English" } as any
    }
  ]);

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.message.includes("ar")));
});
