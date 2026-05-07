"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { registerRestaurantOwnerRequest } from "../../lib/auth-api";
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

export function useRegistrationForm(preferredLanguage: string) {
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

    if (exactCountry) {
      selectCountry(exactCountry);
    } else {
      setCountrySearch(
        selectedCountry
          ? formatCountryName(selectedCountry, preferredLanguage)
          : "",
      );
    }

    setActiveLocationSearch(null);
  }

  function settleCitySearch() {
    const query = citySearch.trim().toLowerCase();
    const exactCity = locationOptions.find(
      (option) =>
        option.label.toLowerCase() === query ||
        option.value.toLowerCase() === query,
    );

    if (exactCity) {
      selectCity(exactCity);
    } else {
      setCitySearch(
        locationOptions.find((option) => option.value === city)?.label ?? city,
      );
    }

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

    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").replace(/^0+/, "");

    const { response, payload } = await registerRestaurantOwnerRequest({
      name: `${firstName} ${lastName}`.trim(),
      restaurantName: String(formData.get("restaurantName") ?? ""),
      username: String(formData.get("username") ?? ""),
      phone: `${selectedCountry.dialCode}${phone}`,
      email: String(formData.get("email") ?? ""),
      country: countryCode,
      city,
      address: String(formData.get("address") ?? ""),
      password,
      preferredLanguage,
      acceptedTerms: acceptedPolicies,
      acceptedPrivacy: acceptedPolicies,
    });

    if (!response.ok) {
      setStatus(payload.error ?? copy.failed);
      return;
    }

    setStatus(payload.data?.resent ? copy.resent : copy.created);
  }

  return {
    acceptedPolicies,
    activeLocationSearch,
    city,
    citySearch,
    citySuggestions,
    copy,
    countryCode,
    countrySearch,
    countrySuggestions,
    selectCity,
    selectCountry,
    selectedCountry,
    setAcceptedPolicies,
    setActiveLocationSearch,
    setCitySearch,
    setCountrySearch,
    settleCitySearch,
    settleCountrySearch,
    status,
    submitRegistration,
  };
}
