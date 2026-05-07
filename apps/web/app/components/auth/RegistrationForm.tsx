"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { PrimaryButton } from "../buttons/PrimaryButton";
import { getRegistrationCopy } from "../../lib/auth-copy";
import {
  allCountries,
  countryMatches,
  formatCountryName,
  getCountryDisplayName,
  getLocationOptions,
  type CountryOption,
  type LocationOption,
} from "../../lib/location-options";
import styles from "./RegistrationForm.module.scss";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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
  const [status, setStatus] = useState("");
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [countryCode, setCountryCode] = useState("");
  const [city, setCity] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [activeLocationSearch, setActiveLocationSearch] = useState<
    "country" | "city" | null
  >(null);
  const copy = getRegistrationCopy(preferredLanguage);
  const selectedCountry = countryCode
    ? allCountries.find((country) => country.isoCode === countryCode)
    : undefined;
  const locationOptions = useMemo(
    () =>
      countryCode ? getLocationOptions(countryCode, preferredLanguage) : [],
    [countryCode, preferredLanguage],
  );
  const countrySuggestions = useMemo(
    () =>
      allCountries
        .filter((country) =>
          countryMatches(country, preferredLanguage, countrySearch),
        )
        .slice(0, 10),
    [countrySearch, preferredLanguage],
  );
  const citySuggestions = useMemo(() => {
    const query = citySearch.trim().toLowerCase();
    return (
      query
        ? locationOptions.filter((location) =>
            location.label.toLowerCase().includes(query),
          )
        : locationOptions
    ).slice(0, 10);
  }, [citySearch, locationOptions]);

  useEffect(() => {
    const nextCity = locationOptions[0]?.value ?? "";
    setCity(nextCity);
    setCitySearch(locationOptions[0]?.label ?? "");
  }, [locationOptions]);

  useEffect(() => {
    setCountrySearch(
      selectedCountry
        ? formatCountryName(selectedCountry, preferredLanguage)
        : "",
    );
  }, [preferredLanguage, selectedCountry]);

  function selectCountry(country: CountryOption) {
    setCountryCode(country.isoCode);
    setCountrySearch(formatCountryName(country, preferredLanguage));
    setActiveLocationSearch(null);
  }

  function selectCity(option: LocationOption) {
    setCity(option.value);
    setCitySearch(option.label);
    setActiveLocationSearch(null);
  }

  function settleCountrySearch() {
    const query = countrySearch.trim().toLowerCase();
    const exactCountry = allCountries.find((country) => {
      const formattedName = formatCountryName(
        country,
        preferredLanguage,
      ).toLowerCase();
      const localizedName = getCountryDisplayName(preferredLanguage)
        .of(country.isoCode)
        ?.toLowerCase();
      return (
        formattedName === query ||
        localizedName === query ||
        country.name.toLowerCase() === query ||
        country.isoCode.toLowerCase() === query
      );
    });

    if (exactCountry) selectCountry(exactCountry);
    else
      setCountrySearch(
        selectedCountry
          ? formatCountryName(selectedCountry, preferredLanguage)
          : "",
      );
    setActiveLocationSearch(null);
  }

  function settleCitySearch() {
    const query = citySearch.trim().toLowerCase();
    const exactCity = locationOptions.find(
      (option) =>
        option.label.toLowerCase() === query ||
        option.value.toLowerCase() === query,
    );

    if (exactCity) selectCity(exactCity);
    else
      setCitySearch(
        locationOptions.find((option) => option.value === city)?.label ?? city,
      );
    setActiveLocationSearch(null);
  }

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(copy.creating);
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setStatus(copy.mismatch);
      return;
    }

    if (!selectedCountry) {
      setStatus(copy.countryRequired);
      return;
    }

    if (!city) {
      setStatus(copy.cityRequired);
      return;
    }

    const response = await fetch(`${apiUrl}/auth/register/restaurant-owner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${String(formData.get("firstName") ?? "").trim()} ${String(formData.get("lastName") ?? "").trim()}`.trim(),
        restaurantName: formData.get("restaurantName"),
        username: formData.get("username"),
        phone: `${selectedCountry.dialCode}${String(formData.get("phone") ?? "").replace(/^0+/, "")}`,
        email: formData.get("email"),
        country: countryCode,
        city,
        address: formData.get("address"),
        password,
        preferredLanguage,
        acceptedTerms: acceptedPolicies,
        acceptedPrivacy: acceptedPolicies,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error ?? copy.failed);
      return;
    }

    setStatus(payload.data?.resent ? copy.resent : copy.created);
  }

  return (
    <form onSubmit={submitRegistration} className={styles.form}>
      <div className={styles.heading}>
        <h2>{registrationLabel}</h2>
        <PrimaryButton testId="registration-submit-top" type="submit">
          {copy.submitRestaurant ?? restaurantLabel}
        </PrimaryButton>
      </div>
      <div className={styles.grid}>
        <label>
          {copy.firstName}
          <input name="firstName" autoComplete="given-name" required />
        </label>
        <label>
          {copy.lastName}
          <input name="lastName" autoComplete="family-name" />
        </label>
        <label>
          {copy.restaurantName}
          <input name="restaurantName" required />
        </label>
        <label>
          {copy.username}
          <input name="username" autoComplete="username" required />
        </label>
        <label>
          {copy.country}
          <input
            autoComplete="off"
            placeholder={copy.selectCountry}
            value={countrySearch}
            onChange={(event) => setCountrySearch(event.target.value)}
            onFocus={() => setActiveLocationSearch("country")}
            onBlur={settleCountrySearch}
            required
          />
          <input name="country" type="hidden" value={countryCode} />
          {activeLocationSearch === "country" ? (
            <div className={styles.suggestions}>
              {countrySuggestions.map((country) => (
                <button
                  key={country.isoCode}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectCountry(country);
                  }}
                >
                  {formatCountryName(country, preferredLanguage)}
                </button>
              ))}
            </div>
          ) : null}
        </label>
        <label>
          {copy.city}
          <input
            autoComplete="off"
            placeholder={copy.selectCity}
            value={citySearch}
            onChange={(event) => setCitySearch(event.target.value)}
            onFocus={() => setActiveLocationSearch("city")}
            onBlur={settleCitySearch}
            disabled={!selectedCountry}
            required
          />
          <input name="city" type="hidden" value={city} />
          {activeLocationSearch === "city" ? (
            <div className={styles.suggestions}>
              {citySuggestions.map((cityOption) => (
                <button
                  key={`${cityOption.value}-${cityOption.label}`}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectCity(cityOption);
                  }}
                >
                  {cityOption.label}
                </button>
              ))}
            </div>
          ) : null}
        </label>
        <label>
          {copy.address}
          <input name="address" autoComplete="street-address" required />
        </label>
        <label>
          {copy.phone}
          <div className={styles.phoneRow}>
            <span>{selectedCountry?.dialCode ?? "--"}</span>
            <input
              name="phone"
              inputMode="tel"
              autoComplete="tel-national"
              required
            />
          </div>
        </label>
        <label>
          {copy.email}
          <input name="email" type="email" autoComplete="email" />
        </label>
        <label>
          {copy.password}
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          {copy.confirmPassword}
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
          checked={acceptedPolicies}
          onChange={(event) => setAcceptedPolicies(event.target.checked)}
          required
        />
        {copy.consent}
        <span className={styles.consentLinks}>
          <a href={`/terms?lang=${preferredLanguage}`} target="_blank">
            {copy.terms}
          </a>
          <a href={`/privacy?lang=${preferredLanguage}`} target="_blank">
            {copy.privacy}
          </a>
        </span>
      </label>
      <PrimaryButton type="submit" wide>
        {copy.submitRestaurant ?? restaurantLabel}
      </PrimaryButton>
      <p className={styles.status}>{status}</p>
    </form>
  );
}
