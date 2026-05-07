"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import type { LanguageOption } from "../../lib/public-page";

interface LanguageBootstrapProps {
  fallbackLanguage: string;
  languages: LanguageOption[];
}

const languageStorageKey = "scanmenu-language";

export function LanguageBootstrap({
  fallbackLanguage,
  languages,
}: LanguageBootstrapProps) {
  const router = useRouter();
  const languageCodes = useMemo(
    () => languages.map((language) => language.code),
    [languages],
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlLanguage = searchParams.get("lang");

    if (urlLanguage) {
      localStorage.setItem(languageStorageKey, urlLanguage);
      return;
    }

    const storedLanguage = localStorage.getItem(languageStorageKey);
    const browserLanguage = navigator.language?.split("-")[0];
    const nextLanguage =
      (storedLanguage &&
        languageCodes.includes(storedLanguage) &&
        storedLanguage) ||
      (browserLanguage &&
        languageCodes.includes(browserLanguage) &&
        browserLanguage) ||
      fallbackLanguage;

    localStorage.setItem(languageStorageKey, nextLanguage);
    router.replace(`${window.location.pathname}?lang=${nextLanguage}`);
  }, [fallbackLanguage, languageCodes, router]);

  return null;
}
