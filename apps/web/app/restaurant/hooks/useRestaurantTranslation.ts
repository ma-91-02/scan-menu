import { useEffect, useState } from "react";
import {
  getRestaurantPageCopy,
  type SupportedLanguage,
} from "@scanmenu/shared";
import { getRestaurantPage } from "../../../lib/api";

const rtlLanguages = ["ar", "ur", "fa", "he"];

export function useRestaurantTranslation(
  ownerLanguage: string,
  languages: SupportedLanguage[],
) {
  const [ui, setUi] = useState<Record<string, string>>(() =>
    getRestaurantPageCopy("en"),
  );

  const text = (key: string) =>
    ui[key] ?? getRestaurantPageCopy("en")[key] ?? key;
  const direction = rtlLanguages.includes(ownerLanguage) ? "rtl" : "ltr";

  useEffect(() => {
    const selectedLanguage = languages.find(
      (language) => language.code === ownerLanguage,
    );
    const nextDirection =
      selectedLanguage?.direction ??
      (rtlLanguages.includes(ownerLanguage) ? "rtl" : "ltr");
    document.documentElement.lang = ownerLanguage;
    document.documentElement.dir = nextDirection;
  }, [languages, ownerLanguage]);

  useEffect(() => {
    setUi(getRestaurantPageCopy(ownerLanguage));
    void getRestaurantPage(ownerLanguage).then(setUi);
  }, [ownerLanguage]);

  return {
    direction,
    text,
  };
}
