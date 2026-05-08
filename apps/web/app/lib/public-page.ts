import type {
  LocalizedPublicPageContent,
  SupportedLanguage,
} from "@babili/shared";
import { flagForLanguage } from "./flags";

export interface LanguageOption {
  code: string;
  nativeName: string;
  flag: string;
}

export type PublicPageContent = LocalizedPublicPageContent;

const rtlLanguages = new Set(["ar", "ur", "fa", "he"]);

export function isRtlLanguage(language: string) {
  return rtlLanguages.has(language);
}

export function buildLanguageOptions(
  languages: SupportedLanguage[],
): LanguageOption[] {
  return languages.map((item) => ({
    code: String(item.code),
    nativeName: item.nativeName,
    flag: flagForLanguage(String(item.code)),
  }));
}
