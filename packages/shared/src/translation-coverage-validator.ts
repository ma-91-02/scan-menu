import type {
  AllergenTaxonomyItem,
  IngredientTaxonomyItem,
  ModifierTaxonomyItem,
  ScanMenuLanguage,
  ScanMenuLanguageCode,
  TranslationCatalogItem
} from "./translation-catalog.js";

export interface TranslationCoverageIssue {
  scope: string;
  id: string;
  message: string;
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
  private readonly requiredCodes: ScanMenuLanguageCode[];
  private readonly rtlCodes = ["ar", "ur", "fa", "he"];

  constructor(languages: ScanMenuLanguage[]) {
    this.requiredCodes = languages.map((language) => language.code);
  }

  validateLanguages(languages: ScanMenuLanguage[]): TranslationCoverageResult {
    const issues: TranslationCoverageIssue[] = [];
    const actualCodes = languages.map((language) => language.code);

    for (const code of this.requiredCodes) {
      if (!actualCodes.includes(code)) {
        issues.push({ scope: "languages", id: code, message: "Required language is missing" });
      }
    }

    for (const language of languages) {
      const expectedDirection = this.rtlCodes.includes(language.code) ? "rtl" : "ltr";
      if (language.direction !== expectedDirection) {
        issues.push({
          scope: "languages",
          id: language.code,
          message: `Expected ${expectedDirection} direction`
        });
      }
    }

    return this.result(issues);
  }

  validateDictionary(dictionary: TranslationCatalogItem[]): TranslationCoverageResult {
    return this.validateTranslatableCollection("dictionary", dictionary);
  }

  validateIngredientTaxonomy(ingredients: IngredientTaxonomyItem[]): TranslationCoverageResult {
    return this.validateTranslatableCollection("ingredients", ingredients);
  }

  validateModifierTaxonomy(modifiers: ModifierTaxonomyItem[]): TranslationCoverageResult {
    return this.validateTranslatableCollection("modifiers", modifiers);
  }

  validateAllergenTaxonomy(allergens: AllergenTaxonomyItem[]): TranslationCoverageResult {
    return this.validateTranslatableCollection("allergens", allergens);
  }

  private validateTranslatableCollection(scope: string, items: TranslatableItem[]): TranslationCoverageResult {
    const issues: TranslationCoverageIssue[] = [];

    for (const item of items) {
      const id = item.key ?? item.id ?? "unknown";
      for (const code of this.requiredCodes) {
        const value = item.translations[code];
        if (typeof value !== "string" || value.trim().length === 0) {
          issues.push({
            scope,
            id,
            message: `Missing translation for ${code}`
          });
        }
      }
    }

    return this.result(issues);
  }

  private result(issues: TranslationCoverageIssue[]): TranslationCoverageResult {
    return { ok: issues.length === 0, issues };
  }
}
