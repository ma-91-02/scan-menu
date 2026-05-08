import assert from "node:assert/strict";
import test from "node:test";
import {
  allergenTaxonomy,
  ingredientTaxonomy,
  menuSectionTaxonomy,
  modifierTaxonomy,
  restaurantPageTranslationKeys,
  babiliLanguages,
  TranslationCoverageValidator,
  uiTranslations,
} from "@babili/shared";
import { getPublicPageContentForCoverage } from "./server.js";

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
  "th",
];

function assertCompleteTranslations(
  collection: Array<{ translations: Record<string, string> }>,
) {
  for (const item of collection) {
    for (const language of requiredLanguageCodes) {
      const value = item.translations[language];
      assert.equal(typeof value, "string");
      assert.ok((value ?? "").trim().length > 0);
    }
  }
}

function formatCoverageIssues(
  result: ReturnType<TranslationCoverageValidator["validateAllCatalogs"]>,
) {
  return result.issues
    .map((issue) => {
      const missing = issue.missingLanguages?.length
        ? ` missing=[${issue.missingLanguages.join(", ")}]`
        : "";
      return `${issue.scope}:${issue.id} - ${issue.message}${missing}`;
    })
    .join("\n");
}

function assertCoveragePasses(
  result: ReturnType<TranslationCoverageValidator["validateAllCatalogs"]>,
) {
  assert.equal(formatCoverageIssues(result), "");
  assert.equal(result.ok, true);
}

const validator = new TranslationCoverageValidator(babiliLanguages);

test("supported language list contains every required language", () => {
  assert.deepEqual(
    babiliLanguages.map((language) => language.code),
    requiredLanguageCodes,
  );
  assertCoveragePasses(validator.validateLanguages(babiliLanguages));
});

test("rtl languages are marked correctly", () => {
  const rtlLanguages = babiliLanguages
    .filter((language) => language.direction === "rtl")
    .map((language) => language.code);
  assert.deepEqual(rtlLanguages, ["ar", "ur", "fa", "he"]);
});

test("each UI translation key includes all required languages", () => {
  assertCompleteTranslations(uiTranslations);
  assertCoveragePasses(validator.validateDictionary(uiTranslations));
});

test("restaurant page keys are present and fully translated", () => {
  assert.ok(restaurantPageTranslationKeys.length > 0);
  assertCoveragePasses(
    validator.validateRestaurantPage(
      uiTranslations,
      restaurantPageTranslationKeys,
    ),
  );
});

test("public page content is fully translated", () => {
  assertCoveragePasses(
    validator.validatePublicPage(getPublicPageContentForCoverage()),
  );
});

test("each ingredient includes all required languages", () => {
  assertCompleteTranslations(ingredientTaxonomy);
  assertCoveragePasses(
    validator.validateIngredientTaxonomy(ingredientTaxonomy),
  );
});

test("each modifier includes all required languages", () => {
  assertCompleteTranslations(modifierTaxonomy);
  assertCoveragePasses(validator.validateModifierTaxonomy(modifierTaxonomy));
});

test("each allergen includes all required languages", () => {
  assertCompleteTranslations(allergenTaxonomy);
  assertCoveragePasses(validator.validateAllergenTaxonomy(allergenTaxonomy));
});

test("each menu section includes all required languages", () => {
  assertCompleteTranslations(menuSectionTaxonomy);
  assertCoveragePasses(
    validator.validateMenuSectionTaxonomy(menuSectionTaxonomy),
  );
  assert.ok(menuSectionTaxonomy.some((section) => section.id === "hot_drinks"));
  assert.ok(menuSectionTaxonomy.some((section) => section.id === "grills"));
  assert.ok(menuSectionTaxonomy.some((section) => section.id === "pizza"));
});

test("all translation catalogs pass coverage validation", () => {
  assertCoveragePasses(
    validator.validateAllCatalogs({
      allergens: allergenTaxonomy,
      dictionary: uiTranslations,
      ingredients: ingredientTaxonomy,
      menuSections: menuSectionTaxonomy,
      modifiers: modifierTaxonomy,
      publicPage: getPublicPageContentForCoverage(),
      restaurantPageKeys: restaurantPageTranslationKeys,
    }),
  );
});

test("TranslationCoverageValidator fails when a required language is missing", () => {
  const result = validator.validateDictionary([
    {
      key: "test.missing_language",
      translations: { en: "Only English" } as any,
    },
  ]);

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.message.includes("ar")));
});
