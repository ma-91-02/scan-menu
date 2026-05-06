"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import locationData from "countries-states-cities";
import type { ICountry } from "countries-states-cities";

interface LanguageOption {
  code: string;
  nativeName: string;
  flag: string;
}

interface LanguageSelectProps {
  currentLanguage: string;
  languages: LanguageOption[];
}

interface LanguageBootstrapProps {
  fallbackLanguage: string;
  languages: LanguageOption[];
}

interface LoginFormProps {
  loginLabel: string;
  preferredLanguage: string;
}

interface RegistrationFormProps {
  registrationLabel: string;
  preferredLanguage: string;
  restaurantLabel: string;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const languageStorageKey = "scanmenu-language";
const sessionStorageKey = "scanmenu-session";

interface CountryOption {
  isoCode: string;
  name: string;
  flag: string;
  dialCode: string;
}

interface LocationOption {
  value: string;
  label: string;
}

type LocationTranslations = Record<string, Record<string, string>>;

const sourceCountries = locationData.getAllCountries();
const allCountries = sourceCountries
  .map((country) => ({
    isoCode: country.iso2,
    name: country.name,
    flag: country.emoji,
    dialCode: normalizeDialCode(country.phone_code)
  }))
  .sort((first, second) => first.name.localeCompare(second.name));

const defaultCountryCode = allCountries.find((country) => country.isoCode === "MA")?.isoCode ?? allCountries[0]?.isoCode ?? "MA";
const fallbackCountry: CountryOption = {
  isoCode: defaultCountryCode,
  name: "Morocco",
  flag: "🇲🇦",
  dialCode: "+212"
};

function normalizeDialCode(phonecode: string) {
  const trimmed = phonecode.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
}

function getCountryDisplayName(language: string) {
  try {
    return new Intl.DisplayNames([language || "en"], { type: "region" });
  } catch {
    return new Intl.DisplayNames(["en"], { type: "region" });
  }
}

function formatCountryName(country: CountryOption, language: string) {
  const localizedName = getCountryDisplayName(language).of(country.isoCode) ?? country.name;
  const dialCode = country.dialCode ? ` (${country.dialCode})` : "";

  return `${country.flag ? `${country.flag} ` : ""}${localizedName}${dialCode}`;
}

function countryMatches(country: CountryOption, language: string, query: string) {
  const value = query.trim().toLowerCase();
  if (!value) return true;
  const localizedName = getCountryDisplayName(language).of(country.isoCode) ?? "";

  return [country.name, localizedName, country.isoCode, country.dialCode]
    .some((item) => item.toLowerCase().includes(value));
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
    Tetouan: { ar: "تطوان", fr: "Tétouan" }
  },
  SA: {
    Riyadh: { ar: "الرياض" },
    Jeddah: { ar: "جدة" },
    Mecca: { ar: "مكة" },
    Medina: { ar: "المدينة المنورة" },
    Dammam: { ar: "الدمام" },
    Taif: { ar: "الطائف" },
    Tabuk: { ar: "تبوك" }
  },
  AE: {
    Dubai: { ar: "دبي" },
    "Abu Dhabi": { ar: "أبوظبي" },
    Sharjah: { ar: "الشارقة" },
    Ajman: { ar: "عجمان" },
    "Ras Al Khaimah": { ar: "رأس الخيمة" }
  },
  RU: {
    Moscow: { ru: "Москва" },
    "Saint Petersburg": { ru: "Санкт-Петербург" },
    Kazan: { ru: "Казань" },
    Sochi: { ru: "Сочи" }
  },
  TR: {
    Istanbul: { tr: "İstanbul" },
    Ankara: { tr: "Ankara" },
    Izmir: { tr: "İzmir" },
    Antalya: { tr: "Antalya" },
    Bursa: { tr: "Bursa" }
  },
  FR: {
    Paris: { fr: "Paris" },
    Lyon: { fr: "Lyon" },
    Marseille: { fr: "Marseille" },
    Nice: { fr: "Nice" },
    Toulouse: { fr: "Toulouse" }
  },
  DE: {
    Munich: { de: "München" },
    Cologne: { de: "Köln" },
    Nuremberg: { de: "Nürnberg" }
  },
  ES: {
    Seville: { es: "Sevilla" },
    "A Coruna": { es: "A Coruña" }
  }
};

function localizeLocationName(countryCode: string, name: string, language: string) {
  return cityTranslationOverrides[countryCode]?.[name]?.[language] ?? name;
}

function getLocationOptions(countryCode: string, language: string): LocationOption[] {
  const country = getCountryByIso2(countryCode);
  const states = country ? locationData.getStatesOfCountry(country.id) : [];
  const cities = states.flatMap((state) =>
    locationData.getCitiesOfState(state.id).map((city) => ({
      value: city.name,
      label: city.state_code
        ? `${localizeLocationName(countryCode, city.name, language)} (${state.state_code})`
        : localizeLocationName(countryCode, city.name, language)
    }))
  );

  if (cities.length > 0) {
    return cities.sort((first, second) => first.label.localeCompare(second.label));
  }

  const stateOptions = states
    .map((state) => ({
      value: state.name,
      label: localizeLocationName(countryCode, state.name, language)
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

const registrationCopy = {
  ar: {
    firstName: "الاسم الأول", lastName: "اسم العائلة", restaurantName: "اسم المطعم", username: "اسم المستخدم", country: "الدولة", city: "المدينة / المحافظة", address: "العنوان", phone: "رقم الهاتف", email: "البريد الإلكتروني", password: "كلمة المرور", confirmPassword: "تأكيد كلمة المرور", selectCountry: "اكتب اسم الدولة للبحث", selectCity: "اكتب اسم المدينة أو المحافظة للبحث", consent: "أوافق على شروط الاستخدام وسياسة الخصوصية", terms: "الشروط", privacy: "الخصوصية", creating: "جاري إنشاء الحساب...", mismatch: "كلمتا المرور غير متطابقتين", created: "تم إنشاء الحساب. يرجى فحص بريدك لتأكيد الحساب قبل تسجيل الدخول.", resent: "تم إرسال رابط التحقق مرة أخرى. يرجى فحص بريدك.", failed: "فشل التسجيل", submitRestaurant: "تسجيل مطعمك"
  },
  en: {
    firstName: "First name", lastName: "Last name", restaurantName: "Restaurant name", username: "Username", country: "Country", city: "City / province", address: "Address", phone: "Phone number", email: "Email", password: "Password", confirmPassword: "Confirm password", selectCountry: "Type country name to search", selectCity: "Type city or province to search", consent: "I agree to the Terms of Use and Privacy Policy", terms: "Terms", privacy: "Privacy", creating: "Creating account...", mismatch: "Passwords do not match", created: "Account created. Please check your email to verify the account before signing in.", resent: "A verification link was sent again. Please check your email.", failed: "Registration failed", submitRestaurant: "Register your restaurant"
  },
  ru: {
    firstName: "Имя", lastName: "Фамилия", restaurantName: "Название ресторана", username: "Имя пользователя", country: "Страна", city: "Город / регион", address: "Адрес", phone: "Телефон", email: "Email", password: "Пароль", confirmPassword: "Подтвердите пароль", selectCountry: "Введите страну для поиска", selectCity: "Введите город или регион для поиска", consent: "Я принимаю Условия использования и Политику конфиденциальности", terms: "Условия", privacy: "Конфиденциальность", creating: "Создание аккаунта...", mismatch: "Пароли не совпадают", created: "Аккаунт создан. Проверьте email для подтверждения.", resent: "Ссылка подтверждения отправлена повторно.", failed: "Регистрация не удалась", submitRestaurant: "Зарегистрировать ресторан"
  },
  tr: {
    firstName: "Ad", lastName: "Soyad", restaurantName: "Restoran adı", username: "Kullanıcı adı", country: "Ülke", city: "Şehir / il", address: "Adres", phone: "Telefon numarası", email: "E-posta", password: "Şifre", confirmPassword: "Şifreyi onayla", selectCountry: "Ülke seç", selectCity: "Şehir veya il seç", consent: "Kullanım Şartları ve Gizlilik Politikasını kabul ediyorum", terms: "Şartlar", privacy: "Gizlilik", creating: "Hesap oluşturuluyor...", mismatch: "Şifreler eşleşmiyor", created: "Hesap oluşturuldu. Giriş yapmadan önce e-postanızı doğrulayın.", resent: "Doğrulama bağlantısı tekrar gönderildi.", failed: "Kayıt başarısız", submitRestaurant: "Restoranını kaydet"
  },
  fr: {
    firstName: "Prénom", lastName: "Nom", restaurantName: "Nom du restaurant", username: "Nom d'utilisateur", country: "Pays", city: "Ville / province", address: "Adresse", phone: "Téléphone", email: "Email", password: "Mot de passe", confirmPassword: "Confirmer le mot de passe", selectCountry: "Choisir le pays", selectCity: "Choisir la ville ou province", consent: "J'accepte les Conditions d'utilisation et la Politique de confidentialité", terms: "Conditions", privacy: "Confidentialité", creating: "Création du compte...", mismatch: "Les mots de passe ne correspondent pas", created: "Compte créé. Vérifiez votre email avant de vous connecter.", resent: "Un nouveau lien de vérification a été envoyé.", failed: "Échec de l'inscription", submitRestaurant: "Inscrire votre restaurant"
  },
  es: {
    firstName: "Nombre", lastName: "Apellido", restaurantName: "Nombre del restaurante", username: "Usuario", country: "País", city: "Ciudad / provincia", address: "Dirección", phone: "Teléfono", email: "Email", password: "Contraseña", confirmPassword: "Confirmar contraseña", selectCountry: "Selecciona país", selectCity: "Selecciona ciudad o provincia", consent: "Acepto los Términos de uso y la Política de privacidad", terms: "Términos", privacy: "Privacidad", creating: "Creando cuenta...", mismatch: "Las contraseñas no coinciden", created: "Cuenta creada. Revisa tu email para verificarla.", resent: "Se envió nuevamente el enlace de verificación.", failed: "Registro fallido", submitRestaurant: "Registrar tu restaurante"
  },
  de: {
    firstName: "Vorname", lastName: "Nachname", restaurantName: "Restaurantname", username: "Benutzername", country: "Land", city: "Stadt / Region", address: "Adresse", phone: "Telefonnummer", email: "E-Mail", password: "Passwort", confirmPassword: "Passwort bestätigen", selectCountry: "Land auswählen", selectCity: "Stadt oder Region auswählen", consent: "Ich stimme den Nutzungsbedingungen und der Datenschutzerklärung zu", terms: "Bedingungen", privacy: "Datenschutz", creating: "Konto wird erstellt...", mismatch: "Passwörter stimmen nicht überein", created: "Konto erstellt. Bitte bestätigen Sie Ihre E-Mail.", resent: "Der Bestätigungslink wurde erneut gesendet.", failed: "Registrierung fehlgeschlagen", submitRestaurant: "Restaurant registrieren"
  }
} as const;

const loginCopy = {
  ar: {
    identifier: "البريد الإلكتروني أو اسم المستخدم أو رقم الهاتف",
    password: "كلمة المرور",
    signingIn: "جاري تسجيل الدخول...",
    failed: "تعذر تسجيل الدخول. تحقق من البيانات ثم حاول مرة أخرى.",
    verificationRequired: "يجب تأكيد بريدك الإلكتروني قبل تسجيل الدخول.",
    welcome: "مرحباً، يتم تحويلك الآن...",
    enterEmail: "اكتب بريدك الإلكتروني أولاً.",
    sendingVerification: "جاري إرسال رابط التحقق...",
    resent: "إذا كان هذا البريد يحتاج تأكيداً، فقد تم إرسال رابط جديد.",
    resendFailed: "تعذر إرسال رابط التحقق.",
    forgotPassword: "نسيت كلمة المرور؟",
    resendVerification: "إعادة إرسال رابط التحقق"
  },
  en: {
    identifier: "Email, username, or phone",
    password: "Password",
    signingIn: "Signing in...",
    failed: "Could not sign in. Check your details and try again.",
    verificationRequired: "Please verify your email before signing in.",
    welcome: "Welcome. Redirecting...",
    enterEmail: "Enter your email first.",
    sendingVerification: "Sending verification link...",
    resent: "If this email needs verification, a new link has been sent.",
    resendFailed: "Could not send verification link.",
    forgotPassword: "Forgot password?",
    resendVerification: "Resend verification email"
  },
  ru: {
    identifier: "Email, имя пользователя или телефон",
    password: "Пароль",
    signingIn: "Вход...",
    failed: "Не удалось войти. Проверьте данные и попробуйте снова.",
    verificationRequired: "Подтвердите email перед входом.",
    welcome: "Добро пожаловать. Перенаправляем...",
    enterEmail: "Сначала введите email.",
    sendingVerification: "Отправляем ссылку подтверждения...",
    resent: "Если этому email нужно подтверждение, новая ссылка отправлена.",
    resendFailed: "Не удалось отправить ссылку подтверждения.",
    forgotPassword: "Забыли пароль?",
    resendVerification: "Отправить подтверждение снова"
  },
  tr: {
    identifier: "E-posta, kullanıcı adı veya telefon",
    password: "Şifre",
    signingIn: "Giriş yapılıyor...",
    failed: "Giriş yapılamadı. Bilgileri kontrol edin.",
    verificationRequired: "Giriş yapmadan önce e-postanızı doğrulayın.",
    welcome: "Hoş geldiniz. Yönlendiriliyor...",
    enterEmail: "Önce e-postanızı yazın.",
    sendingVerification: "Doğrulama bağlantısı gönderiliyor...",
    resent: "Bu e-posta doğrulama gerektiriyorsa yeni bağlantı gönderildi.",
    resendFailed: "Doğrulama bağlantısı gönderilemedi.",
    forgotPassword: "Şifremi unuttum",
    resendVerification: "Doğrulama e-postasını tekrar gönder"
  },
  fr: {
    identifier: "Email, nom d'utilisateur ou téléphone",
    password: "Mot de passe",
    signingIn: "Connexion...",
    failed: "Connexion impossible. Vérifiez vos informations.",
    verificationRequired: "Veuillez vérifier votre email avant de vous connecter.",
    welcome: "Bienvenue. Redirection...",
    enterEmail: "Saisissez d'abord votre email.",
    sendingVerification: "Envoi du lien de vérification...",
    resent: "Si cet email nécessite une vérification, un nouveau lien a été envoyé.",
    resendFailed: "Impossible d'envoyer le lien de vérification.",
    forgotPassword: "Mot de passe oublié ?",
    resendVerification: "Renvoyer l'email de vérification"
  },
  es: {
    identifier: "Email, usuario o teléfono",
    password: "Contraseña",
    signingIn: "Iniciando sesión...",
    failed: "No se pudo iniciar sesión. Revisa tus datos.",
    verificationRequired: "Verifica tu email antes de iniciar sesión.",
    welcome: "Bienvenido. Redirigiendo...",
    enterEmail: "Escribe primero tu email.",
    sendingVerification: "Enviando enlace de verificación...",
    resent: "Si este email necesita verificación, se envió un nuevo enlace.",
    resendFailed: "No se pudo enviar el enlace de verificación.",
    forgotPassword: "¿Olvidaste tu contraseña?",
    resendVerification: "Reenviar email de verificación"
  },
  de: {
    identifier: "E-Mail, Benutzername oder Telefon",
    password: "Passwort",
    signingIn: "Anmeldung...",
    failed: "Anmeldung fehlgeschlagen. Bitte Daten prüfen.",
    verificationRequired: "Bitte bestätigen Sie Ihre E-Mail vor der Anmeldung.",
    welcome: "Willkommen. Weiterleitung...",
    enterEmail: "Geben Sie zuerst Ihre E-Mail ein.",
    sendingVerification: "Bestätigungslink wird gesendet...",
    resent: "Falls diese E-Mail bestätigt werden muss, wurde ein neuer Link gesendet.",
    resendFailed: "Bestätigungslink konnte nicht gesendet werden.",
    forgotPassword: "Passwort vergessen?",
    resendVerification: "Bestätigungs-E-Mail erneut senden"
  }
} as const;

export function LanguageBootstrap({ fallbackLanguage, languages }: LanguageBootstrapProps) {
  const router = useRouter();
  const languageCodes = useMemo(() => languages.map((language) => language.code), [languages]);

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
      (storedLanguage && languageCodes.includes(storedLanguage) && storedLanguage) ||
      (browserLanguage && languageCodes.includes(browserLanguage) && browserLanguage) ||
      fallbackLanguage;

    localStorage.setItem(languageStorageKey, nextLanguage);
    router.replace(`${window.location.pathname}?lang=${nextLanguage}`);
  }, [fallbackLanguage, languageCodes, router]);

  return null;
}

export function LanguageSelect({ currentLanguage, languages }: LanguageSelectProps) {
  const router = useRouter();

  return (
    <label className="language-select">
      <span aria-hidden="true">🌐</span>
      <select
        aria-label="Choose language"
        value={currentLanguage}
        onChange={(event) => {
          localStorage.setItem(languageStorageKey, event.target.value);
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

export function LoginForm({ loginLabel, preferredLanguage }: LoginFormProps) {
  const [status, setStatus] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const copy = loginCopy[preferredLanguage as keyof typeof loginCopy] ?? loginCopy.en;

  async function login() {
    setStatus(copy.signingIn);

    const response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier,
        password
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      if (response.status === 403 && payload.code === "EMAIL_VERIFICATION_REQUIRED") {
        const params = new URLSearchParams({
          lang: preferredLanguage,
          notice: "required",
          email: identifier
        });
        window.location.href = `/verify-email?${params.toString()}`;
        return;
      }

      setStatus(response.status === 401 ? copy.failed : payload.error ?? copy.failed);
      return;
    }

    setStatus(copy.welcome);
    localStorage.setItem(sessionStorageKey, payload.data.session.id);
    window.location.href = payload.data.redirectTo;
  }

  async function resendVerification() {
    if (!identifier.trim()) {
      setStatus(copy.enterEmail);
      return;
    }

    setStatus(copy.sendingVerification);
    const response = await fetch(`${apiUrl}/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: identifier })
    });
    await response.json().catch(() => null);
    setStatus(response.ok ? copy.resent : copy.resendFailed);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        login();
      }}
      className="public-form"
    >
      <h2>{loginLabel}</h2>
      <label>
        {copy.identifier}
        <input
          name="identifier"
          autoComplete="username"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
        />
      </label>
      <label>
        {copy.password}
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      <button className="public-button primary" type="button" onClick={login}>
        {loginLabel}
      </button>
      <a className="auth-inline-link" href="/reset-password">
        {copy.forgotPassword}
      </a>
      <button className="auth-link-button" type="button" onClick={() => void resendVerification()}>
        {copy.resendVerification}
      </button>
      <p className="form-status">{status}</p>
    </form>
  );
}

export function RegistrationForm({
  registrationLabel,
  preferredLanguage,
  restaurantLabel
}: RegistrationFormProps) {
  const [status, setStatus] = useState("");
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  const [city, setCity] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [activeLocationSearch, setActiveLocationSearch] = useState<"country" | "city" | null>(null);
  const copy = registrationCopy[preferredLanguage as keyof typeof registrationCopy] ?? registrationCopy.en;
  const selectedCountry = allCountries.find((country) => country.isoCode === countryCode) ?? allCountries[0] ?? fallbackCountry;
  const locationOptions = useMemo(() => getLocationOptions(countryCode, preferredLanguage), [countryCode, preferredLanguage]);
  const countrySuggestions = useMemo(
    () => allCountries.filter((country) => countryMatches(country, preferredLanguage, countrySearch)).slice(0, 10),
    [countrySearch, preferredLanguage]
  );
  const citySuggestions = useMemo(() => {
    const query = citySearch.trim().toLowerCase();
    return (query ? locationOptions.filter((location) => location.label.toLowerCase().includes(query)) : locationOptions).slice(0, 10);
  }, [citySearch, locationOptions]);

  useEffect(() => {
    const nextCity = locationOptions[0]?.value ?? "";
    setCity(nextCity);
    setCitySearch(nextCity);
  }, [locationOptions]);

  useEffect(() => {
    setCountrySearch(formatCountryName(selectedCountry, preferredLanguage));
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
      const formattedName = formatCountryName(country, preferredLanguage).toLowerCase();
      const localizedName = getCountryDisplayName(preferredLanguage).of(country.isoCode)?.toLowerCase();
      return formattedName === query || localizedName === query || country.name.toLowerCase() === query || country.isoCode.toLowerCase() === query;
    });

    if (exactCountry) selectCountry(exactCountry);
    else setCountrySearch(formatCountryName(selectedCountry, preferredLanguage));
    setActiveLocationSearch(null);
  }

  function settleCitySearch() {
    const query = citySearch.trim().toLowerCase();
    const exactCity = locationOptions.find((option) => option.label.toLowerCase() === query || option.value.toLowerCase() === query);

    if (exactCity) selectCity(exactCity);
    else setCitySearch(locationOptions.find((option) => option.value === city)?.label ?? city);
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
        acceptedPrivacy: acceptedPolicies
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error ?? copy.failed);
      return;
    }

    setStatus(payload.data?.resent ? copy.resent : copy.created);
  }

  return (
    <form onSubmit={submitRegistration} className="registration-form">
      <div className="registration-heading">
        <h2>{registrationLabel}</h2>
        <button className="public-button primary" data-testid="registration-submit-top" type="submit">
          {copy.submitRestaurant ?? restaurantLabel}
        </button>
      </div>
      <div className="registration-grid">
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
            <div className="location-suggestion-list">
              {countrySuggestions.map((country) => (
                <button key={country.isoCode} type="button" onMouseDown={(event) => {
                  event.preventDefault();
                  selectCountry(country);
                }}>
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
            required
          />
          <input name="city" type="hidden" value={city} />
          {activeLocationSearch === "city" ? (
            <div className="location-suggestion-list">
              {citySuggestions.map((cityOption) => (
                <button key={`${cityOption.value}-${cityOption.label}`} type="button" onMouseDown={(event) => {
                  event.preventDefault();
                  selectCity(cityOption);
                }}>
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
          <div className="phone-input-row">
            <span>{selectedCountry.dialCode}</span>
            <input name="phone" inputMode="tel" autoComplete="tel-national" required />
          </div>
        </label>
        <label>
          {copy.email}
          <input name="email" type="email" autoComplete="email" />
        </label>
        <label>
          {copy.password}
          <input name="password" type="password" autoComplete="new-password" required />
        </label>
        <label>
          {copy.confirmPassword}
          <input name="confirmPassword" type="password" autoComplete="new-password" required />
        </label>
      </div>
      <label className="registration-consent-row">
        <input
          type="checkbox"
          checked={acceptedPolicies}
          onChange={(event) => setAcceptedPolicies(event.target.checked)}
          required
        />
        {copy.consent}
        <span className="consent-links">
          <a href={`/terms?lang=${preferredLanguage}`} target="_blank">{copy.terms}</a>
          <a href={`/privacy?lang=${preferredLanguage}`} target="_blank">{copy.privacy}</a>
        </span>
      </label>
      <button className="public-button primary wide" type="submit">
        {copy.submitRestaurant ?? restaurantLabel}
      </button>
      <p className="form-status">{status}</p>
    </form>
  );
}
