"use client";

import { useRouter } from "next/navigation";
import type { LanguageOption } from "../../lib/public-page";
import { storageKeys } from "../../lib/storage-keys";
import styles from "./LanguageSwitcher.module.scss";

interface LanguageSelectProps {
  currentLanguage: string;
  languages: LanguageOption[];
}

export function LanguageSelect({
  currentLanguage,
  languages,
}: LanguageSelectProps) {
  const router = useRouter();

  return (
    <label className={styles.switcher}>
      <span aria-hidden="true">🌐</span>
      <select
        aria-label="Choose language"
        value={currentLanguage}
        onChange={(event) => {
          localStorage.setItem(storageKeys.language, event.target.value);
          router.push(`/?lang=${event.target.value}`);
        }}
      >
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.flag} {language.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
