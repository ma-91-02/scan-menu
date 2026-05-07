import type { ReactNode } from "react";
import type { LanguageList, TextLookup } from "../types";

interface SettingsPanelProps {
  currencySettings: ReactNode;
  languages: LanguageList;
  ownerLanguage: string;
  text: TextLookup;
  onUpdateOwnerLanguage: (language: string) => void;
}

export function SettingsPanel({
  currencySettings,
  languages,
  ownerLanguage,
  text,
  onUpdateOwnerLanguage,
}: SettingsPanelProps) {
  return (
    <section className="owner-module-card settings-panel">
      <h2>{text("restaurant.settings")}</h2>
      <label className="owner-settings-control">
        {text("restaurant.language")}
        <select
          value={ownerLanguage}
          onChange={(event) => void onUpdateOwnerLanguage(event.target.value)}
        >
          {languages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.nativeName}
            </option>
          ))}
        </select>
      </label>
      {currencySettings}
    </section>
  );
}
