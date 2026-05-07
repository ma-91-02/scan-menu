import { currencyLabel, fallbackCurrencyCodes } from "../data/currency";
import type { TextLookup } from "../types";

interface CurrencySettingsProps {
  currencySearch: string;
  ownerLanguage: string;
  restaurantCurrency: string;
  text: TextLookup;
  visibleCurrencyResults: string[];
  onCurrencySearchChange: (value: string) => void;
  onUpdateRestaurantCurrency: (currency: string) => void;
}

export function CurrencySettings({
  currencySearch,
  ownerLanguage,
  restaurantCurrency,
  text,
  visibleCurrencyResults,
  onCurrencySearchChange,
  onUpdateRestaurantCurrency,
}: CurrencySettingsProps) {
  return (
    <label className="currency-select-row">
      {text("restaurant.currency")}
      <input
        placeholder={text("restaurant.currency_search")}
        value={currencySearch}
        onChange={(event) => onCurrencySearchChange(event.target.value)}
      />
      {visibleCurrencyResults.length ? (
        <div className="currency-result-list">
          {visibleCurrencyResults.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => void onUpdateRestaurantCurrency(code)}
            >
              {currencyLabel(code, ownerLanguage)}
            </button>
          ))}
        </div>
      ) : null}
      <select
        value={restaurantCurrency}
        onChange={(event) =>
          void onUpdateRestaurantCurrency(event.target.value)
        }
      >
        {fallbackCurrencyCodes.map((code) => (
          <option key={code} value={code}>
            {currencyLabel(code, ownerLanguage)}
          </option>
        ))}
      </select>
    </label>
  );
}
