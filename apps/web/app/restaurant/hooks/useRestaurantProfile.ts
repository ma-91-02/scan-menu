import { useMemo, useState } from "react";
import {
  deleteRestaurantAccount,
  logoutRestaurantSession,
  updateRestaurantLanguage,
  updateRestaurantProfile,
} from "../api/restaurant-dashboard-api";
import { searchCurrencyCodes } from "../data/currency";
import {
  defaultOwnerLanguage,
  defaultRestaurantCurrency,
  defaultRestaurantProfile,
} from "../data/default-restaurant-data";
import type { RestaurantProfile, TextLookup } from "../types";
import { fileToDataUrl } from "../utils";

type ProfileLabelKey = keyof Pick<
  RestaurantProfile,
  | "ownerFirstName"
  | "ownerLastName"
  | "email"
  | "name"
  | "phone"
  | "address"
  | "country"
  | "city"
>;

interface UseRestaurantProfileOptions {
  ownerLanguage: string;
  setOwnerLanguage: (language: string) => void;
  text: TextLookup;
}

export function useRestaurantProfile({
  ownerLanguage,
  setOwnerLanguage,
  text,
}: UseRestaurantProfileOptions) {
  const [profile, setProfile] = useState<RestaurantProfile>(
    defaultRestaurantProfile,
  );
  const [restaurantCurrency, setRestaurantCurrency] = useState(
    defaultRestaurantCurrency,
  );
  const [currencySearch, setCurrencySearch] = useState("");

  const profileLabels: Record<ProfileLabelKey, string> = {
    ownerFirstName: text("profile.owner_first_name"),
    ownerLastName: text("profile.owner_last_name"),
    email: text("form.email"),
    name: text("profile.restaurant_name"),
    phone: text("profile.phone"),
    address: text("profile.address"),
    country: text("profile.country"),
    city: text("profile.city"),
  };
  const currencyOptions = useMemo(
    () => searchCurrencyCodes(currencySearch, ownerLanguage),
    [currencySearch, ownerLanguage],
  );
  const visibleCurrencyResults = useMemo(
    () => (currencySearch.trim() ? currencyOptions.slice(0, 10) : []),
    [currencyOptions, currencySearch],
  );

  function applyProfile(nextProfile: RestaurantProfile) {
    setProfile(nextProfile);
    setOwnerLanguage(nextProfile.operatingLanguage ?? defaultOwnerLanguage);
    setRestaurantCurrency(nextProfile.currency ?? defaultRestaurantCurrency);
  }

  async function updateOwnerLanguage(
    restaurantId: string,
    nextLanguage: string,
  ) {
    setOwnerLanguage(nextLanguage);
    await updateRestaurantLanguage(restaurantId, nextLanguage);
  }

  async function updateRestaurantCurrency(
    restaurantId: string,
    nextCurrency: string,
  ) {
    setRestaurantCurrency(nextCurrency);
    setCurrencySearch("");
    const nextProfile = await updateRestaurantProfile(restaurantId, {
      currency: nextCurrency,
    });
    if (nextProfile) setProfile(nextProfile);
  }

  async function handleLogoUpload(restaurantId: string, file?: File) {
    if (!file) return;
    const logoUrl = await fileToDataUrl(file);
    const nextProfile = { ...profile, logoUrl };
    setProfile(nextProfile);
    const savedProfile = await updateRestaurantProfile(restaurantId, {
      ownerFirstName: nextProfile.ownerFirstName,
      ownerLastName: nextProfile.ownerLastName,
      email: nextProfile.email,
      restaurantName: nextProfile.name,
      phone: nextProfile.phone,
      address: nextProfile.address,
      country: nextProfile.country,
      city: nextProfile.city,
      currency: restaurantCurrency,
      logoUrl,
    });
    if (savedProfile) setProfile(savedProfile);
  }

  async function saveProfile(restaurantId: string) {
    const savedProfile = await updateRestaurantProfile(restaurantId, {
      ownerFirstName: profile.ownerFirstName,
      ownerLastName: profile.ownerLastName,
      email: profile.email,
      restaurantName: profile.name,
      phone: profile.phone,
      address: profile.address,
      country: profile.country,
      city: profile.city,
      currency: restaurantCurrency,
      logoUrl: profile.logoUrl,
    });
    if (savedProfile) setProfile(savedProfile);
  }

  async function logout() {
    await logoutRestaurantSession();
    window.location.href = "/";
  }

  async function deleteAccount() {
    if (!window.confirm(text("restaurant.delete_account_confirm"))) return;
    const deleted = await deleteRestaurantAccount();
    if (deleted) {
      window.location.href = "/";
    }
  }

  return {
    applyProfile,
    currencySearch,
    deleteAccount,
    handleLogoUpload,
    logout,
    profile,
    profileLabels,
    restaurantCurrency,
    saveProfile,
    setCurrencySearch,
    setOwnerLanguage,
    setProfile,
    setRestaurantCurrency,
    updateOwnerLanguage,
    updateRestaurantCurrency,
    visibleCurrencyResults,
  };
}
