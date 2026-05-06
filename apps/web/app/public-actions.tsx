"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

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
}

interface RegistrationFormProps {
  registrationLabel: string;
  preferredLanguage: string;
  restaurantLabel: string;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const languageStorageKey = "scanmenu-language";
const sessionStorageKey = "scanmenu-session";
const supportedCountries = [
  { code: "ma", dialCode: "+212", cities: ["Casablanca", "Rabat", "Marrakesh", "Fes", "Tangier", "Agadir", "Meknes", "Oujda"] },
  { code: "sa", dialCode: "+966", cities: ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Taif"] },
  { code: "ae", dialCode: "+971", cities: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"] },
  { code: "eg", dialCode: "+20", cities: ["Cairo", "Alexandria", "Giza", "Mansoura", "Tanta", "Aswan"] },
  { code: "tr", dialCode: "+90", cities: ["Istanbul", "Ankara", "Izmir", "Antalya", "Bursa"] },
  { code: "fr", dialCode: "+33", cities: ["Paris", "Lyon", "Marseille", "Nice", "Toulouse"] },
  { code: "de", dialCode: "+49", cities: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"] },
  { code: "es", dialCode: "+34", cities: ["Madrid", "Barcelona", "Valencia", "Seville", "Malaga"] },
  { code: "it", dialCode: "+39", cities: ["Rome", "Milan", "Naples", "Turin", "Florence"] },
  { code: "us", dialCode: "+1", cities: ["New York", "Los Angeles", "Chicago", "Houston", "Miami"] }
] as const;

const countryNames: Record<string, Record<string, string>> = {
  ar: { ma: "المغرب", sa: "السعودية", ae: "الإمارات", eg: "مصر", tr: "تركيا", fr: "فرنسا", de: "ألمانيا", es: "إسبانيا", it: "إيطاليا", us: "الولايات المتحدة" },
  en: { ma: "Morocco", sa: "Saudi Arabia", ae: "United Arab Emirates", eg: "Egypt", tr: "Turkey", fr: "France", de: "Germany", es: "Spain", it: "Italy", us: "United States" },
  fr: { ma: "Maroc", sa: "Arabie saoudite", ae: "Émirats arabes unis", eg: "Égypte", tr: "Turquie", fr: "France", de: "Allemagne", es: "Espagne", it: "Italie", us: "États-Unis" },
  es: { ma: "Marruecos", sa: "Arabia Saudita", ae: "Emiratos Árabes Unidos", eg: "Egipto", tr: "Turquía", fr: "Francia", de: "Alemania", es: "España", it: "Italia", us: "Estados Unidos" },
  de: { ma: "Marokko", sa: "Saudi-Arabien", ae: "Vereinigte Arabische Emirate", eg: "Ägypten", tr: "Türkei", fr: "Frankreich", de: "Deutschland", es: "Spanien", it: "Italien", us: "Vereinigte Staaten" },
  tr: { ma: "Fas", sa: "Suudi Arabistan", ae: "Birleşik Arap Emirlikleri", eg: "Mısır", tr: "Türkiye", fr: "Fransa", de: "Almanya", es: "İspanya", it: "İtalya", us: "Amerika Birleşik Devletleri" },
  ru: { ma: "Марокко", sa: "Саудовская Аравия", ae: "ОАЭ", eg: "Египет", tr: "Турция", fr: "Франция", de: "Германия", es: "Испания", it: "Италия", us: "США" }
};

const cityNames: Record<string, Record<string, string>> = {
  ar: {
    Casablanca: "الدار البيضاء", Rabat: "الرباط", Marrakesh: "مراكش", Fes: "فاس", Tangier: "طنجة", Agadir: "أكادير", Meknes: "مكناس", Oujda: "وجدة",
    Riyadh: "الرياض", Jeddah: "جدة", Mecca: "مكة", Medina: "المدينة", Dammam: "الدمام", Khobar: "الخبر", Taif: "الطائف",
    Dubai: "دبي", "Abu Dhabi": "أبوظبي", Sharjah: "الشارقة", Ajman: "عجمان", "Ras Al Khaimah": "رأس الخيمة",
    Cairo: "القاهرة", Alexandria: "الإسكندرية", Giza: "الجيزة", Mansoura: "المنصورة", Tanta: "طنطا", Aswan: "أسوان",
    Istanbul: "إسطنبول", Ankara: "أنقرة", Izmir: "إزمير", Antalya: "أنطاليا", Bursa: "بورصة",
    Paris: "باريس", Lyon: "ليون", Marseille: "مرسيليا", Nice: "نيس", Toulouse: "تولوز",
    Berlin: "برلين", Munich: "ميونخ", Hamburg: "هامبورغ", Frankfurt: "فرانكفورت", Cologne: "كولونيا",
    Madrid: "مدريد", Barcelona: "برشلونة", Valencia: "فالنسيا", Seville: "إشبيلية", Malaga: "مالقة",
    Rome: "روما", Milan: "ميلانو", Naples: "نابولي", Turin: "تورينو", Florence: "فلورنسا",
    "New York": "نيويورك", "Los Angeles": "لوس أنجلوس", Chicago: "شيكاغو", Houston: "هيوستن", Miami: "ميامي"
  }
};

const registrationCopy = {
  ar: {
    firstName: "الاسم الأول", lastName: "اسم العائلة", restaurantName: "اسم المطعم", username: "اسم المستخدم", country: "الدولة", city: "المدينة / المحافظة", address: "العنوان", phone: "رقم الهاتف", email: "البريد الإلكتروني", password: "كلمة المرور", confirmPassword: "تأكيد كلمة المرور", selectCountry: "اختر الدولة", selectCity: "اختر المدينة أو المحافظة", consent: "أوافق على شروط الاستخدام وسياسة الخصوصية", terms: "الشروط", privacy: "الخصوصية", creating: "جاري إنشاء الحساب...", mismatch: "كلمتا المرور غير متطابقتين", created: "تم إنشاء الحساب. يرجى فحص بريدك لتأكيد الحساب قبل تسجيل الدخول.", resent: "تم إرسال رابط التحقق مرة أخرى. يرجى فحص بريدك.", failed: "فشل التسجيل"
  },
  en: {
    firstName: "First name", lastName: "Last name", restaurantName: "Restaurant name", username: "Username", country: "Country", city: "City / province", address: "Address", phone: "Phone number", email: "Email", password: "Password", confirmPassword: "Confirm password", selectCountry: "Select country", selectCity: "Select city or province", consent: "I agree to the Terms of Use and Privacy Policy", terms: "Terms", privacy: "Privacy", creating: "Creating account...", mismatch: "Passwords do not match", created: "Account created. Please check your email to verify the account before signing in.", resent: "A verification link was sent again. Please check your email.", failed: "Registration failed"
  },
  ru: {
    firstName: "Имя", lastName: "Фамилия", restaurantName: "Название ресторана", username: "Имя пользователя", country: "Страна", city: "Город / регион", address: "Адрес", phone: "Телефон", email: "Email", password: "Пароль", confirmPassword: "Подтвердите пароль", selectCountry: "Выберите страну", selectCity: "Выберите город или регион", consent: "Я принимаю Условия использования и Политику конфиденциальности", terms: "Условия", privacy: "Конфиденциальность", creating: "Создание аккаунта...", mismatch: "Пароли не совпадают", created: "Аккаунт создан. Проверьте email для подтверждения.", resent: "Ссылка подтверждения отправлена повторно.", failed: "Регистрация не удалась"
  },
  tr: {
    firstName: "Ad", lastName: "Soyad", restaurantName: "Restoran adı", username: "Kullanıcı adı", country: "Ülke", city: "Şehir / il", address: "Adres", phone: "Telefon numarası", email: "E-posta", password: "Şifre", confirmPassword: "Şifreyi onayla", selectCountry: "Ülke seç", selectCity: "Şehir veya il seç", consent: "Kullanım Şartları ve Gizlilik Politikasını kabul ediyorum", terms: "Şartlar", privacy: "Gizlilik", creating: "Hesap oluşturuluyor...", mismatch: "Şifreler eşleşmiyor", created: "Hesap oluşturuldu. Giriş yapmadan önce e-postanızı doğrulayın.", resent: "Doğrulama bağlantısı tekrar gönderildi.", failed: "Kayıt başarısız"
  },
  fr: {
    firstName: "Prénom", lastName: "Nom", restaurantName: "Nom du restaurant", username: "Nom d'utilisateur", country: "Pays", city: "Ville / province", address: "Adresse", phone: "Téléphone", email: "Email", password: "Mot de passe", confirmPassword: "Confirmer le mot de passe", selectCountry: "Choisir le pays", selectCity: "Choisir la ville ou province", consent: "J'accepte les Conditions d'utilisation et la Politique de confidentialité", terms: "Conditions", privacy: "Confidentialité", creating: "Création du compte...", mismatch: "Les mots de passe ne correspondent pas", created: "Compte créé. Vérifiez votre email avant de vous connecter.", resent: "Un nouveau lien de vérification a été envoyé.", failed: "Échec de l'inscription"
  },
  es: {
    firstName: "Nombre", lastName: "Apellido", restaurantName: "Nombre del restaurante", username: "Usuario", country: "País", city: "Ciudad / provincia", address: "Dirección", phone: "Teléfono", email: "Email", password: "Contraseña", confirmPassword: "Confirmar contraseña", selectCountry: "Selecciona país", selectCity: "Selecciona ciudad o provincia", consent: "Acepto los Términos de uso y la Política de privacidad", terms: "Términos", privacy: "Privacidad", creating: "Creando cuenta...", mismatch: "Las contraseñas no coinciden", created: "Cuenta creada. Revisa tu email para verificarla.", resent: "Se envió nuevamente el enlace de verificación.", failed: "Registro fallido"
  },
  de: {
    firstName: "Vorname", lastName: "Nachname", restaurantName: "Restaurantname", username: "Benutzername", country: "Land", city: "Stadt / Region", address: "Adresse", phone: "Telefonnummer", email: "E-Mail", password: "Passwort", confirmPassword: "Passwort bestätigen", selectCountry: "Land auswählen", selectCity: "Stadt oder Region auswählen", consent: "Ich stimme den Nutzungsbedingungen und der Datenschutzerklärung zu", terms: "Bedingungen", privacy: "Datenschutz", creating: "Konto wird erstellt...", mismatch: "Passwörter stimmen nicht überein", created: "Konto erstellt. Bitte bestätigen Sie Ihre E-Mail.", resent: "Der Bestätigungslink wurde erneut gesendet.", failed: "Registrierung fehlgeschlagen"
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

export function LoginForm({ loginLabel }: LoginFormProps) {
  const [status, setStatus] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    setStatus("Signing in...");

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
      setStatus(payload.error ?? "Login failed");
      return;
    }

    setStatus(`Welcome ${payload.data.user.name}. Redirecting...`);
    localStorage.setItem(sessionStorageKey, payload.data.session.id);
    window.location.href = payload.data.redirectTo;
  }

  async function resendVerification() {
    if (!identifier.trim()) {
      setStatus("Enter your email first.");
      return;
    }

    setStatus("Sending verification link...");
    const response = await fetch(`${apiUrl}/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: identifier })
    });
    await response.json().catch(() => null);
    setStatus(response.ok ? "If this email needs verification, a new link has been sent." : "Could not send verification link.");
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
        Email, username, or phone
        <input
          name="identifier"
          autoComplete="username"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
        />
      </label>
      <label>
        Password
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
        Forgot password?
      </a>
      <button className="auth-link-button" type="button" onClick={() => void resendVerification()}>
        Resend verification email
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
  const [countryCode, setCountryCode] = useState<(typeof supportedCountries)[number]["code"]>("ma");
  const [city, setCity] = useState<string>(supportedCountries[0].cities[0]);
  const copy = registrationCopy[preferredLanguage as keyof typeof registrationCopy] ?? registrationCopy.en;
  const selectedCountry = supportedCountries.find((country) => country.code === countryCode) ?? supportedCountries[0];
  const countryLabel = (code: string) => countryNames[preferredLanguage]?.[code] ?? countryNames.en?.[code] ?? code.toUpperCase();
  const cityLabel = (value: string) => cityNames[preferredLanguage]?.[value] ?? value;

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
          {restaurantLabel}
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
          <select
            name="country"
            value={countryCode}
            onChange={(event) => {
              const nextCountryCode = event.target.value as typeof countryCode;
              const nextCountry = supportedCountries.find((country) => country.code === nextCountryCode) ?? supportedCountries[0];
              setCountryCode(nextCountry.code);
              setCity(nextCountry.cities[0]);
            }}
            required
          >
            {supportedCountries.map((country) => (
              <option key={country.code} value={country.code}>
                {countryLabel(country.code)} ({country.dialCode})
              </option>
            ))}
          </select>
        </label>
        <label>
          {copy.city}
          <select name="city" value={city} onChange={(event) => setCity(event.target.value)} required>
            {selectedCountry.cities.map((cityOption) => (
              <option key={cityOption} value={cityOption}>
                {cityLabel(cityOption)}
              </option>
            ))}
          </select>
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
        {restaurantLabel}
      </button>
      <p className="form-status">{status}</p>
    </form>
  );
}
