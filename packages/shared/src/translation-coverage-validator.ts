import type {
  AllergenTaxonomyItem,
  IngredientTaxonomyItem,
  MenuSectionTaxonomyItem,
  ModifierTaxonomyItem,
  BabiliLanguage,
  BabiliLanguageCode,
  TranslationCatalogItem,
} from "./translation-catalog.js";

export interface TranslationCoverageIssue {
  scope: string;
  id: string;
  message: string;
  missingLanguages?: string[];
}

export interface TranslationCoverageResult {
  ok: boolean;
  issues: TranslationCoverageIssue[];
}

type TranslatableItem = {
  id?: string;
  key?: string;
  translations: Record<string, string>;
};

export class TranslationCoverageValidator {
  private readonly requiredCodes: BabiliLanguageCode[];
  private readonly rtlCodes = ["ar", "ur", "fa", "he"];

  constructor(languages: BabiliLanguage[]) {
    this.requiredCodes = languages.map((language) => language.code);
  }

  validateLanguages(languages: BabiliLanguage[]): TranslationCoverageResult {
    const issues: TranslationCoverageIssue[] = [];
    const actualCodes = languages.map((language) => language.code);

    if (actualCodes.length !== this.requiredCodes.length) {
      issues.push({
        scope: "languages",
        id: "count",
        message: `Expected ${this.requiredCodes.length} languages, received ${actualCodes.length}`,
      });
    }

    for (const code of this.requiredCodes) {
      if (!actualCodes.includes(code)) {
        issues.push({
          scope: "languages",
          id: code,
          message: "Required language is missing",
        });
      }
    }

    for (const language of languages) {
      const expectedDirection = this.rtlCodes.includes(language.code)
        ? "rtl"
        : "ltr";
      if (language.direction !== expectedDirection) {
        issues.push({
          scope: "languages",
          id: language.code,
          message: `Expected ${expectedDirection} direction`,
        });
      }
    }

    return this.result(issues);
  }

  validateDictionary(
    dictionary: TranslationCatalogItem[],
  ): TranslationCoverageResult {
    return this.validateTranslatableCollection("dictionary", dictionary);
  }

  validatePublicPage(publicPage: unknown): TranslationCoverageResult {
    return this.validateLocalizedObject("public-page", publicPage);
  }

  validateRestaurantPage(
    dictionary: TranslationCatalogItem[],
    restaurantPageKeys: readonly string[],
  ): TranslationCoverageResult {
    const issues: TranslationCoverageIssue[] = [];
    const byKey = new Map(dictionary.map((item) => [item.key, item]));

    for (const key of restaurantPageKeys) {
      const item = byKey.get(key);
      if (!item) {
        issues.push({
          scope: "restaurant-page",
          id: key,
          message: "Restaurant page key is missing from dictionary",
        });
        continue;
      }
      issues.push(
        ...this.validateTranslatableCollection("restaurant-page", [item])
          .issues,
      );
    }

    return this.result(issues);
  }

  validateIngredientTaxonomy(
    ingredients: IngredientTaxonomyItem[],
  ): TranslationCoverageResult {
    return this.validateTranslatableCollection("ingredients", ingredients);
  }

  validateModifierTaxonomy(
    modifiers: ModifierTaxonomyItem[],
  ): TranslationCoverageResult {
    return this.validateTranslatableCollection("modifiers", modifiers);
  }

  validateAllergenTaxonomy(
    allergens: AllergenTaxonomyItem[],
  ): TranslationCoverageResult {
    return this.validateTranslatableCollection("allergens", allergens);
  }

  validateMenuSectionTaxonomy(
    sections: MenuSectionTaxonomyItem[],
  ): TranslationCoverageResult {
    return this.validateTranslatableCollection("sections", sections);
  }

  validateAllCatalogs(catalogs: {
    allergens: AllergenTaxonomyItem[];
    dictionary: TranslationCatalogItem[];
    ingredients: IngredientTaxonomyItem[];
    menuSections: MenuSectionTaxonomyItem[];
    modifiers: ModifierTaxonomyItem[];
    publicPage?: unknown;
    restaurantPageKeys?: readonly string[];
  }): TranslationCoverageResult {
    return this.mergeResults([
      this.validateDictionary(catalogs.dictionary),
      this.validateIngredientTaxonomy(catalogs.ingredients),
      this.validateModifierTaxonomy(catalogs.modifiers),
      this.validateAllergenTaxonomy(catalogs.allergens),
      this.validateMenuSectionTaxonomy(catalogs.menuSections),
      catalogs.restaurantPageKeys
        ? this.validateRestaurantPage(
            catalogs.dictionary,
            catalogs.restaurantPageKeys,
          )
        : this.result([]),
      catalogs.publicPage
        ? this.validatePublicPage(catalogs.publicPage)
        : this.result([]),
    ]);
  }

  private validateTranslatableCollection(
    scope: string,
    items: TranslatableItem[],
  ): TranslationCoverageResult {
    const issues: TranslationCoverageIssue[] = [];

    for (const item of items) {
      const id = item.key ?? item.id ?? "unknown";
      const missingLanguages: string[] = [];
      for (const code of this.requiredCodes) {
        const value = item.translations[code];
        if (typeof value !== "string" || value.trim().length === 0) {
          missingLanguages.push(code);
        }
      }
      if (missingLanguages.length) {
        issues.push({
          scope,
          id,
          message: `Missing or empty translations: ${missingLanguages.join(", ")}`,
          missingLanguages,
        });
      }
    }

    return this.result(issues);
  }

  private validateLocalizedObject(
    scope: string,
    value: unknown,
  ): TranslationCoverageResult {
    const issues: TranslationCoverageIssue[] = [];
    this.walkLocalizedObject(scope, "$", value, issues);
    return this.result(issues);
  }

  private walkLocalizedObject(
    scope: string,
    path: string,
    value: unknown,
    issues: TranslationCoverageIssue[],
  ) {
    if (!value || typeof value !== "object") return;

    if (Array.isArray(value)) {
      value.forEach((item, index) =>
        this.walkLocalizedObject(scope, `${path}[${index}]`, item, issues),
      );
      return;
    }

    const record = value as Record<string, unknown>;
    if (this.looksLikeLocalizedText(record)) {
      const translations = record as Record<string, string>;
      const missingLanguages = this.requiredCodes.filter((code) => {
        const translated = translations[code];
        return typeof translated !== "string" || translated.trim().length === 0;
      });
      if (missingLanguages.length) {
        issues.push({
          scope,
          id: path,
          message: `Missing or empty localized values: ${missingLanguages.join(", ")}`,
          missingLanguages,
        });
      }
      return;
    }

    for (const [key, nestedValue] of Object.entries(record)) {
      this.walkLocalizedObject(scope, `${path}.${key}`, nestedValue, issues);
    }
  }

  private looksLikeLocalizedText(record: Record<string, unknown>) {
    return this.requiredCodes.some((code) => code !== "id" && code in record);
  }

  private mergeResults(
    results: TranslationCoverageResult[],
  ): TranslationCoverageResult {
    return this.result(results.flatMap((result) => result.issues));
  }

  private result(
    issues: TranslationCoverageIssue[],
  ): TranslationCoverageResult {
    return { ok: issues.length === 0, issues };
  }
}
