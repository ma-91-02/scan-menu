import locationData from "countries-states-cities";
import type { ICountry } from "countries-states-cities";

export interface CountryOption {
  isoCode: string;
  name: string;
  flag: string;
  dialCode: string;
}

export interface LocationOption {
  value: string;
  label: string;
}

type LocationTranslations = Record<string, Record<string, string>>;

const sourceCountries = locationData.getAllCountries();
export const allCountries = sourceCountries
  .map((country) => ({
    isoCode: country.iso2,
    name: country.name,
    flag: country.emoji,
    dialCode: normalizeDialCode(country.phone_code),
  }))
  .sort((first, second) => first.name.localeCompare(second.name));

function normalizeDialCode(phonecode: string) {
  const trimmed = phonecode.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
}

export function getCountryDisplayName(language: string) {
  try {
    return new Intl.DisplayNames([language || "en"], { type: "region" });
  } catch {
    return new Intl.DisplayNames(["en"], { type: "region" });
  }
}

export function formatCountryName(country: CountryOption, language: string) {
  const localizedName =
    getCountryDisplayName(language).of(country.isoCode) ?? country.name;
  const dialCode = country.dialCode ? ` (${country.dialCode})` : "";

  return `${country.flag ? `${country.flag} ` : ""}${localizedName}${dialCode}`;
}

export function countryMatches(
  country: CountryOption,
  language: string,
  query: string,
) {
  const value = query.trim().toLowerCase();
  if (!value) return true;
  const localizedName =
    getCountryDisplayName(language).of(country.isoCode) ?? "";

  return [country.name, localizedName, country.isoCode, country.dialCode].some(
    (item) => item.toLowerCase().includes(value),
  );
}

const cityTranslationOverrides: Record<string, LocationTranslations> = {
  MA: {
    Agadir: { ar: "أكادير", fr: "Agadir" },
    Casablanca: { ar: "الدار البيضاء", fr: "Casablanca" },
    Fes: { ar: "فاس", fr: "Fès" },
    Marrakesh: { ar: "مراكش", fr: "Marrakech" },
    Meknes: { ar: "مكناس", fr: "Meknès" },
    Oujda: { ar: "وجدة", fr: "Oujda" },
    Rabat: { ar: "الرباط", fr: "Rabat" },
    Tangier: { ar: "طنجة", fr: "Tanger" },
    Tetouan: { ar: "تطوان", fr: "Tétouan" },
  },
  IQ: {
    "Al Anbar Governorate": { ar: "محافظة الأنبار" },
    "Al Muthanna Governorate": { ar: "محافظة المثنى" },
    "Al-Qādisiyyah Governorate": { ar: "محافظة القادسية" },
    "Babylon Governorate": { ar: "محافظة بابل" },
    "Baghdad Governorate": { ar: "محافظة بغداد" },
    "Basra Governorate": { ar: "محافظة البصرة" },
    "Dhi Qar Governorate": { ar: "محافظة ذي قار" },
    "Diyala Governorate": { ar: "محافظة ديالى" },
    "Dohuk Governorate": { ar: "محافظة دهوك" },
    "Erbil Governorate": { ar: "محافظة أربيل" },
    "Karbala Governorate": { ar: "محافظة كربلاء" },
    "Kirkuk Governorate": { ar: "محافظة كركوك" },
    "Maysan Governorate": { ar: "محافظة ميسان" },
    "Najaf Governorate": { ar: "محافظة النجف" },
    "Nineveh Governorate": { ar: "محافظة نينوى" },
    "Saladin Governorate": { ar: "محافظة صلاح الدين" },
    "Sulaymaniyah Governorate": { ar: "محافظة السليمانية" },
    "Wasit Governorate": { ar: "محافظة واسط" },
    "Al Fallūjah": { ar: "الفلوجة" },
    "Ar Ruţbah": { ar: "الرطبة" },
    Hīt: { ar: "هيت" },
    "Hīt District": { ar: "قضاء هيت" },
    Ramadi: { ar: "الرمادي" },
    "Ar Rumaythah": { ar: "الرميثة" },
    "As Samawah": { ar: "السماوة" },
    "Ad Dīwānīyah": { ar: "الديوانية" },
    "Ash Shāmīyah": { ar: "الشامية" },
    "Nahiyat Ghammas": { ar: "ناحية غماس" },
    "Nāḩiyat ash Shināfīyah": { ar: "ناحية الشنافية" },
    "‘Afak": { ar: "عفك" },
    Afak: { ar: "عفك" },
    Baghdad: { ar: "بغداد" },
    Basrah: { ar: "البصرة" },
    Mosul: { ar: "الموصل" },
    Najaf: { ar: "النجف" },
    Karbala: { ar: "كربلاء" },
    Erbil: { ar: "أربيل" },
    Kirkuk: { ar: "كركوك" },
    Nasiriyah: { ar: "الناصرية" },
    Amarah: { ar: "العمارة" },
    Kut: { ar: "الكوت" },
    "As Sulaymānīyah": { ar: "السليمانية" },
    "Ad Dujayl": { ar: "الدجيل" },
    "Al Ḩillah": { ar: "الحلة" },
  },
  SA: {
    Riyadh: { ar: "الرياض" },
    Jeddah: { ar: "جدة" },
    Mecca: { ar: "مكة" },
    Medina: { ar: "المدينة المنورة" },
    Dammam: { ar: "الدمام" },
    Taif: { ar: "الطائف" },
    Tabuk: { ar: "تبوك" },
  },
  AE: {
    Dubai: { ar: "دبي" },
    "Abu Dhabi": { ar: "أبوظبي" },
    Sharjah: { ar: "الشارقة" },
    Ajman: { ar: "عجمان" },
    "Ras Al Khaimah": { ar: "رأس الخيمة" },
  },
  RU: {
    Moscow: { ru: "Москва" },
    "Saint Petersburg": { ru: "Санкт-Петербург" },
    Kazan: { ru: "Казань" },
    Sochi: { ru: "Сочи" },
  },
  TR: {
    Istanbul: { tr: "İstanbul" },
    Ankara: { tr: "Ankara" },
    Izmir: { tr: "İzmir" },
    Antalya: { tr: "Antalya" },
    Bursa: { tr: "Bursa" },
  },
  FR: {
    Paris: { fr: "Paris" },
    Lyon: { fr: "Lyon" },
    Marseille: { fr: "Marseille" },
    Nice: { fr: "Nice" },
    Toulouse: { fr: "Toulouse" },
  },
  DE: {
    Munich: { de: "München" },
    Cologne: { de: "Köln" },
    Nuremberg: { de: "Nürnberg" },
  },
  ES: {
    Seville: { es: "Sevilla" },
    "A Coruna": { es: "A Coruña" },
  },
};

function localizeLocationName(
  countryCode: string,
  name: string,
  language: string,
) {
  return (
    cityTranslationOverrides[countryCode]?.[name]?.[language] ??
    transliterateArabicLocation(name, language)
  );
}

function transliterateArabicLocation(name: string, language: string) {
  if (language !== "ar") return name;
  return name
    .replace(/^Al[- ]/i, "ال")
    .replace(/^Ar /i, "الر")
    .replace(/^As /i, "الس")
    .replace(/^Ash /i, "الش")
    .replace(/^Ad /i, "الد")
    .replace(/^Nahiyat /i, "ناحية ")
    .replace(/ Governorate$/i, "")
    .replace(/ District$/i, " قضاء")
    .replace(/ū/g, "و")
    .replace(/ā/g, "ا")
    .replace(/ī/g, "ي")
    .replace(/ţ/g, "ط")
    .replace(/ḩ/g, "ح")
    .replace(/[‘']/g, "");
}

export function getLocationOptions(
  countryCode: string,
  language: string,
): LocationOption[] {
  const country = getCountryByIso2(countryCode);
  const states = country ? locationData.getStatesOfCountry(country.id) : [];
  const cities = states.flatMap((state) =>
    locationData.getCitiesOfState(state.id).map((city) => ({
      value: city.name,
      label: city.state_code
        ? `${localizeLocationName(countryCode, city.name, language)} (${localizeLocationName(countryCode, state.name, language)})`
        : localizeLocationName(countryCode, city.name, language),
    })),
  );

  if (cities.length > 0) {
    return cities.sort((first, second) =>
      first.label.localeCompare(second.label),
    );
  }

  const stateOptions = states
    .map((state) => ({
      value: state.name,
      label: localizeLocationName(countryCode, state.name, language),
    }))
    .sort((first, second) => first.label.localeCompare(second.label));

  if (stateOptions.length > 0) {
    return stateOptions;
  }

  const countryName = country?.name ?? countryCode;

  return [{ value: countryName, label: countryName }];
}

function getCountryByIso2(countryCode: string): ICountry | undefined {
  return sourceCountries.find((country) => country.iso2 === countryCode);
}
