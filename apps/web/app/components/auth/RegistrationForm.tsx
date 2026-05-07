"use client";

import { PrimaryButton } from "../buttons/PrimaryButton";
import { formatCountryName } from "../../lib/location-options";
import styles from "./RegistrationForm.module.scss";
import { useRegistrationForm } from "./useRegistrationForm";

interface RegistrationFormProps {
  registrationLabel: string;
  preferredLanguage: string;
  restaurantLabel: string;
}

export function RegistrationForm({
  registrationLabel,
  preferredLanguage,
  restaurantLabel,
}: RegistrationFormProps) {
  const form = useRegistrationForm(preferredLanguage);

  return (
    <form onSubmit={form.submitRegistration} className={styles.form}>
      <div className={styles.heading}>
        <h2>{registrationLabel}</h2>
        <PrimaryButton testId="registration-submit-top" type="submit">
          {form.copy.submitRestaurant ?? restaurantLabel}
        </PrimaryButton>
      </div>
      <div className={styles.grid}>
        <label>
          {form.copy.firstName}
          <input name="firstName" autoComplete="given-name" required />
        </label>
        <label>
          {form.copy.lastName}
          <input name="lastName" autoComplete="family-name" />
        </label>
        <label>
          {form.copy.restaurantName}
          <input name="restaurantName" required />
        </label>
        <label>
          {form.copy.username}
          <input name="username" autoComplete="username" required />
        </label>
        <label>
          {form.copy.country}
          <input
            autoComplete="off"
            placeholder={form.copy.selectCountry}
            value={form.countrySearch}
            onChange={(event) => form.setCountrySearch(event.target.value)}
            onFocus={() => form.setActiveLocationSearch("country")}
            onBlur={form.settleCountrySearch}
            required
          />
          <input name="country" type="hidden" value={form.countryCode} />
          {form.activeLocationSearch === "country" ? (
            <div className={styles.suggestions}>
              {form.countrySuggestions.map((country) => (
                <button
                  key={country.isoCode}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    form.selectCountry(country);
                  }}
                >
                  {formatCountryName(country, preferredLanguage)}
                </button>
              ))}
            </div>
          ) : null}
        </label>
        <label>
          {form.copy.city}
          <input
            autoComplete="off"
            placeholder={form.copy.selectCity}
            value={form.citySearch}
            onChange={(event) => form.setCitySearch(event.target.value)}
            onFocus={() => form.setActiveLocationSearch("city")}
            onBlur={form.settleCitySearch}
            disabled={!form.selectedCountry}
            required
          />
          <input name="city" type="hidden" value={form.city} />
          {form.activeLocationSearch === "city" ? (
            <div className={styles.suggestions}>
              {form.citySuggestions.map((cityOption) => (
                <button
                  key={`${cityOption.value}-${cityOption.label}`}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    form.selectCity(cityOption);
                  }}
                >
                  {cityOption.label}
                </button>
              ))}
            </div>
          ) : null}
        </label>
        <label>
          {form.copy.address}
          <input name="address" autoComplete="street-address" required />
        </label>
        <label>
          {form.copy.phone}
          <div className={styles.phoneRow}>
            <span>{form.selectedCountry?.dialCode ?? "--"}</span>
            <input
              name="phone"
              inputMode="tel"
              autoComplete="tel-national"
              required
            />
          </div>
        </label>
        <label>
          {form.copy.email}
          <input name="email" type="email" autoComplete="email" />
        </label>
        <label>
          {form.copy.password}
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          {form.copy.confirmPassword}
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
          />
        </label>
      </div>
      <label className={styles.consentRow}>
        <input
          type="checkbox"
          checked={form.acceptedPolicies}
          onChange={(event) => form.setAcceptedPolicies(event.target.checked)}
          required
        />
        {form.copy.consent}
        <span className={styles.consentLinks}>
          <a href={`/terms?lang=${preferredLanguage}`} target="_blank">
            {form.copy.terms}
          </a>
          <a href={`/privacy?lang=${preferredLanguage}`} target="_blank">
            {form.copy.privacy}
          </a>
        </span>
      </label>
      <PrimaryButton type="submit" wide>
        {form.copy.submitRestaurant ?? restaurantLabel}
      </PrimaryButton>
      <p className={styles.status}>{form.status}</p>
    </form>
  );
}
