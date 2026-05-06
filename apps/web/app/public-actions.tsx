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
    "Hīt": { ar: "هيت" },
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
    "Al Ḩillah": { ar: "الحلة" }
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
  return cityTranslationOverrides[countryCode]?.[name]?.[language] ?? transliterateArabicLocation(name, language);
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

function getLocationOptions(countryCode: string, language: string): LocationOption[] {
  const country = getCountryByIso2(countryCode);
  const states = country ? locationData.getStatesOfCountry(country.id) : [];
  const cities = states.flatMap((state) =>
    locationData.getCitiesOfState(state.id).map((city) => ({
      value: city.name,
      label: city.state_code
        ? `${localizeLocationName(countryCode, city.name, language)} (${localizeLocationName(countryCode, state.name, language)})`
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
    firstName: "الاسم الأول", lastName: "اسم العائلة", restaurantName: "اسم المطعم", username: "اسم المستخدم", country: "الدولة", city: "المدينة / المحافظة", address: "العنوان", phone: "رقم الهاتف", email: "البريد الإلكتروني", password: "كلمة المرور", confirmPassword: "تأكيد كلمة المرور", selectCountry: "اكتب اسم الدولة للبحث", selectCity: "اختر الدولة أولاً ثم اكتب المدينة أو المحافظة", countryRequired: "اختر الدولة من القائمة أولاً.", cityRequired: "اختر المدينة أو المحافظة من القائمة.", consent: "أوافق على", terms: "شروط الاستخدام", privacy: "سياسة الخصوصية", creating: "جاري إنشاء الحساب...", mismatch: "كلمتا المرور غير متطابقتين", created: "تم إنشاء الحساب. يرجى فحص بريدك لتأكيد الحساب قبل تسجيل الدخول.", resent: "تم إرسال رابط التحقق مرة أخرى. يرجى فحص بريدك.", failed: "فشل التسجيل", submitRestaurant: "تسجيل مطعمك"
  },
  en: {
    firstName: "First name", lastName: "Last name", restaurantName: "Restaurant name", username: "Username", country: "Country", city: "City / province", address: "Address", phone: "Phone number", email: "Email", password: "Password", confirmPassword: "Confirm password", selectCountry: "Type country name to search", selectCity: "Select a country first, then type city or province", countryRequired: "Select a country from the list first.", cityRequired: "Select a city or province from the list.", consent: "I agree to", terms: "Terms of Use", privacy: "Privacy Policy", creating: "Creating account...", mismatch: "Passwords do not match", created: "Account created. Please check your email to verify the account before signing in.", resent: "A verification link was sent again. Please check your email.", failed: "Registration failed", submitRestaurant: "Register your restaurant"
  },
  ru: {
    firstName: "Имя", lastName: "Фамилия", restaurantName: "Название ресторана", username: "Имя пользователя", country: "Страна", city: "Город / регион", address: "Адрес", phone: "Телефон", email: "Email", password: "Пароль", confirmPassword: "Подтвердите пароль", selectCountry: "Введите страну для поиска", selectCity: "Сначала выберите страну, затем город или регион", countryRequired: "Сначала выберите страну из списка.", cityRequired: "Выберите город или регион из списка.", consent: "Я принимаю", terms: "Условия", privacy: "Конфиденциальность", creating: "Создание аккаунта...", mismatch: "Пароли не совпадают", created: "Аккаунт создан. Проверьте email для подтверждения.", resent: "Ссылка подтверждения отправлена повторно.", failed: "Регистрация не удалась", submitRestaurant: "Зарегистрировать ресторан"
  },
  tr: {
    firstName: "Ad", lastName: "Soyad", restaurantName: "Restoran adı", username: "Kullanıcı adı", country: "Ülke", city: "Şehir / il", address: "Adres", phone: "Telefon numarası", email: "E-posta", password: "Şifre", confirmPassword: "Şifreyi onayla", selectCountry: "Ülke seç", selectCity: "Önce ülke seç, sonra şehir veya il yaz", countryRequired: "Önce listeden ülke seçin.", cityRequired: "Listeden şehir veya il seçin.", consent: "Kabul ediyorum", terms: "Şartlar", privacy: "Gizlilik", creating: "Hesap oluşturuluyor...", mismatch: "Şifreler eşleşmiyor", created: "Hesap oluşturuldu. Giriş yapmadan önce e-postanızı doğrulayın.", resent: "Doğrulama bağlantısı tekrar gönderildi.", failed: "Kayıt başarısız", submitRestaurant: "Restoranını kaydet"
  },
  fr: {
    firstName: "Prénom", lastName: "Nom", restaurantName: "Nom du restaurant", username: "Nom d'utilisateur", country: "Pays", city: "Ville / province", address: "Adresse", phone: "Téléphone", email: "Email", password: "Mot de passe", confirmPassword: "Confirmer le mot de passe", selectCountry: "Choisir le pays", selectCity: "Choisissez d'abord un pays, puis la ville ou province", countryRequired: "Choisissez d'abord un pays dans la liste.", cityRequired: "Choisissez une ville ou province dans la liste.", consent: "J'accepte", terms: "Conditions", privacy: "Confidentialité", creating: "Création du compte...", mismatch: "Les mots de passe ne correspondent pas", created: "Compte créé. Vérifiez votre email avant de vous connecter.", resent: "Un nouveau lien de vérification a été envoyé.", failed: "Échec de l'inscription", submitRestaurant: "Inscrire votre restaurant"
  },
  es: {
    firstName: "Nombre", lastName: "Apellido", restaurantName: "Nombre del restaurante", username: "Usuario", country: "País", city: "Ciudad / provincia", address: "Dirección", phone: "Teléfono", email: "Email", password: "Contraseña", confirmPassword: "Confirmar contraseña", selectCountry: "Selecciona país", selectCity: "Primero selecciona país, luego ciudad o provincia", countryRequired: "Selecciona primero un país de la lista.", cityRequired: "Selecciona una ciudad o provincia de la lista.", consent: "Acepto", terms: "Términos", privacy: "Privacidad", creating: "Creando cuenta...", mismatch: "Las contraseñas no coinciden", created: "Cuenta creada. Revisa tu email para verificarla.", resent: "Se envió nuevamente el enlace de verificación.", failed: "Registro fallido", submitRestaurant: "Registrar tu restaurante"
  },
  de: {
    firstName: "Vorname", lastName: "Nachname", restaurantName: "Restaurantname", username: "Benutzername", country: "Land", city: "Stadt / Region", address: "Adresse", phone: "Telefonnummer", email: "E-Mail", password: "Passwort", confirmPassword: "Passwort bestätigen", selectCountry: "Land auswählen", selectCity: "Zuerst Land wählen, dann Stadt oder Region", countryRequired: "Wählen Sie zuerst ein Land aus der Liste.", cityRequired: "Wählen Sie eine Stadt oder Region aus der Liste.", consent: "Ich stimme zu", terms: "Bedingungen", privacy: "Datenschutz", creating: "Konto wird erstellt...", mismatch: "Passwörter stimmen nicht überein", created: "Konto erstellt. Bitte bestätigen Sie Ihre E-Mail.", resent: "Der Bestätigungslink wurde erneut gesendet.", failed: "Registrierung fehlgeschlagen", submitRestaurant: "Restaurant registrieren"
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

interface RegistrationCopy {
  firstName: string;
  lastName: string;
  restaurantName: string;
  username: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  selectCountry: string;
  selectCity: string;
  countryRequired: string;
  cityRequired: string;
  consent: string;
  terms: string;
  privacy: string;
  creating: string;
  mismatch: string;
  created: string;
  resent: string;
  failed: string;
  submitRestaurant: string;
}

interface LoginCopy {
  identifier: string;
  password: string;
  signingIn: string;
  failed: string;
  verificationRequired: string;
  welcome: string;
  enterEmail: string;
  sendingVerification: string;
  resent: string;
  resendFailed: string;
  forgotPassword: string;
  resendVerification: string;
}

const extraRegistrationCopy: Record<string, RegistrationCopy> = Object.fromEntries([
  ["it", ["Nome", "Cognome", "Nome ristorante", "Nome utente", "Paese", "Citta / provincia", "Indirizzo", "Numero di telefono", "Email", "Password", "Conferma password", "Scrivi il nome del paese", "Scegli prima il paese, poi citta o provincia", "Scegli prima un paese dall'elenco.", "Scegli una citta o provincia dall'elenco.", "Accetto", "Termini", "Privacy", "Creazione account...", "Le password non coincidono", "Account creato. Controlla l'email per confermare.", "Link di verifica inviato di nuovo.", "Registrazione non riuscita", "Registra il tuo ristorante"]],
  ["pt", ["Nome", "Sobrenome", "Nome do restaurante", "Usuario", "Pais", "Cidade / provincia", "Endereco", "Telefone", "Email", "Senha", "Confirmar senha", "Digite o pais para buscar", "Escolha primeiro o pais, depois cidade ou provincia", "Escolha primeiro um pais da lista.", "Escolha uma cidade ou provincia da lista.", "Eu aceito", "Termos", "Privacidade", "Criando conta...", "As senhas nao coincidem", "Conta criada. Verifique seu email para confirmar.", "Link de verificacao enviado novamente.", "Falha no registro", "Registrar seu restaurante"]],
  ["zh", ["名字", "姓氏", "餐厅名称", "用户名", "国家", "城市 / 省份", "地址", "电话号码", "邮箱", "密码", "确认密码", "输入国家名称搜索", "先选择国家，再输入城市或省份", "请先从列表选择国家。", "请从列表选择城市或省份。", "我同意", "使用条款", "隐私政策", "正在创建账户...", "两次密码不一致", "账户已创建。请检查邮箱完成验证。", "验证链接已重新发送。", "注册失败", "注册你的餐厅"]],
  ["ja", ["名", "姓", "レストラン名", "ユーザー名", "国", "市区町村 / 都道府県", "住所", "電話番号", "メール", "パスワード", "パスワード確認", "国名を入力して検索", "先に国を選択し、市区町村を入力", "先に一覧から国を選択してください。", "一覧から市区町村または地域を選択してください。", "同意します", "利用規約", "プライバシー", "アカウント作成中...", "パスワードが一致しません", "アカウントを作成しました。メールを確認してください。", "確認リンクを再送しました。", "登録に失敗しました", "レストランを登録"]],
  ["ko", ["이름", "성", "레스토랑 이름", "사용자 이름", "국가", "도시 / 지역", "주소", "전화번호", "이메일", "비밀번호", "비밀번호 확인", "국가명을 입력해 검색", "먼저 국가를 선택한 뒤 도시나 지역 입력", "먼저 목록에서 국가를 선택하세요.", "목록에서 도시 또는 지역을 선택하세요.", "동의합니다", "이용 약관", "개인정보", "계정 생성 중...", "비밀번호가 일치하지 않습니다", "계정이 생성되었습니다. 이메일을 확인하세요.", "인증 링크를 다시 보냈습니다.", "등록 실패", "레스토랑 등록"]],
  ["hi", ["पहला नाम", "अंतिम नाम", "रेस्तरां नाम", "उपयोगकर्ता नाम", "देश", "शहर / प्रांत", "पता", "फोन नंबर", "ईमेल", "पासवर्ड", "पासवर्ड पुष्टि", "देश खोजने के लिए नाम लिखें", "पहले देश चुनें, फिर शहर या प्रांत लिखें", "पहले सूची से देश चुनें।", "सूची से शहर या प्रांत चुनें।", "मैं सहमत हूं", "उपयोग की शर्तें", "गोपनीयता नीति", "खाता बनाया जा रहा है...", "पासवर्ड मेल नहीं खाते", "खाता बना। ईमेल सत्यापित करें।", "सत्यापन लिंक फिर भेजा गया।", "पंजीकरण विफल", "अपना रेस्तरां पंजीकृत करें"]],
  ["ur", ["پہلا نام", "آخری نام", "ریستوران کا نام", "صارف نام", "ملک", "شہر / صوبہ", "پتہ", "فون نمبر", "ای میل", "پاس ورڈ", "پاس ورڈ کی تصدیق", "ملک تلاش کرنے کے لیے نام لکھیں", "پہلے ملک منتخب کریں، پھر شہر یا صوبہ لکھیں", "پہلے فہرست سے ملک منتخب کریں۔", "فہرست سے شہر یا صوبہ منتخب کریں۔", "میں متفق ہوں", "استعمال کی شرائط", "رازداری پالیسی", "اکاؤنٹ بنایا جا رہا ہے...", "پاس ورڈ میل نہیں کھاتے", "اکاؤنٹ بن گیا۔ ای میل تصدیق کریں۔", "تصدیقی لنک دوبارہ بھیجا گیا۔", "رجسٹریشن ناکام", "اپنا ریستوران رجسٹر کریں"]],
  ["fa", ["نام", "نام خانوادگی", "نام رستوران", "نام کاربری", "کشور", "شهر / استان", "آدرس", "شماره تلفن", "ایمیل", "رمز عبور", "تکرار رمز عبور", "نام کشور را برای جستجو بنویسید", "ابتدا کشور را انتخاب کنید، سپس شهر یا استان را بنویسید", "ابتدا کشور را از فهرست انتخاب کنید.", "شهر یا استان را از فهرست انتخاب کنید.", "موافقم", "شرایط استفاده", "حریم خصوصی", "در حال ایجاد حساب...", "رمزها یکسان نیستند", "حساب ایجاد شد. ایمیل را تأیید کنید.", "لینک تأیید دوباره ارسال شد.", "ثبت نام ناموفق بود", "رستوران خود را ثبت کنید"]],
  ["he", ["שם פרטי", "שם משפחה", "שם המסעדה", "שם משתמש", "מדינה", "עיר / מחוז", "כתובת", "טלפון", "אימייל", "סיסמה", "אישור סיסמה", "הקלד שם מדינה לחיפוש", "בחר קודם מדינה ואז עיר או מחוז", "בחר קודם מדינה מהרשימה.", "בחר עיר או מחוז מהרשימה.", "אני מסכים", "תנאי שימוש", "פרטיות", "יוצר חשבון...", "הסיסמאות אינן תואמות", "החשבון נוצר. אשר את האימייל.", "קישור אימות נשלח שוב.", "הרישום נכשל", "רשום את המסעדה שלך"]],
  ["id", ["Nama depan", "Nama belakang", "Nama restoran", "Nama pengguna", "Negara", "Kota / provinsi", "Alamat", "Nomor telepon", "Email", "Kata sandi", "Konfirmasi kata sandi", "Ketik nama negara untuk mencari", "Pilih negara dulu, lalu kota atau provinsi", "Pilih negara dari daftar dulu.", "Pilih kota atau provinsi dari daftar.", "Saya setuju", "Ketentuan", "Privasi", "Membuat akun...", "Kata sandi tidak cocok", "Akun dibuat. Periksa email Anda.", "Tautan verifikasi dikirim lagi.", "Pendaftaran gagal", "Daftarkan restoran Anda"]],
  ["ms", ["Nama pertama", "Nama keluarga", "Nama restoran", "Nama pengguna", "Negara", "Bandar / negeri", "Alamat", "Nombor telefon", "E-mel", "Kata laluan", "Sahkan kata laluan", "Taip nama negara untuk carian", "Pilih negara dahulu, kemudian bandar atau negeri", "Pilih negara daripada senarai dahulu.", "Pilih bandar atau negeri daripada senarai.", "Saya bersetuju", "Terma", "Privasi", "Mencipta akaun...", "Kata laluan tidak sepadan", "Akaun dicipta. Semak e-mel anda.", "Pautan pengesahan dihantar semula.", "Pendaftaran gagal", "Daftar restoran anda"]],
  ["uk", ["Ім'я", "Прізвище", "Назва ресторану", "Ім'я користувача", "Країна", "Місто / область", "Адреса", "Телефон", "Email", "Пароль", "Підтвердіть пароль", "Введіть країну для пошуку", "Спочатку виберіть країну, потім місто або область", "Спочатку виберіть країну зі списку.", "Виберіть місто або область зі списку.", "Я погоджуюся", "Умови", "Приватність", "Створення акаунта...", "Паролі не збігаються", "Акаунт створено. Перевірте email.", "Посилання підтвердження надіслано знову.", "Реєстрація не вдалася", "Зареєструвати ресторан"]],
  ["pl", ["Imię", "Nazwisko", "Nazwa restauracji", "Nazwa użytkownika", "Kraj", "Miasto / województwo", "Adres", "Telefon", "Email", "Hasło", "Potwierdź hasło", "Wpisz kraj, aby wyszukać", "Najpierw wybierz kraj, potem miasto lub region", "Najpierw wybierz kraj z listy.", "Wybierz miasto lub region z listy.", "Akceptuję", "Warunki", "Prywatność", "Tworzenie konta...", "Hasła nie są zgodne", "Konto utworzone. Sprawdź email.", "Link weryfikacyjny wysłano ponownie.", "Rejestracja nie powiodła się", "Zarejestruj restaurację"]],
  ["nl", ["Voornaam", "Achternaam", "Restaurantnaam", "Gebruikersnaam", "Land", "Stad / provincie", "Adres", "Telefoonnummer", "E-mail", "Wachtwoord", "Bevestig wachtwoord", "Typ landnaam om te zoeken", "Kies eerst land, daarna stad of provincie", "Kies eerst een land uit de lijst.", "Kies een stad of provincie uit de lijst.", "Ik ga akkoord", "Voorwaarden", "Privacy", "Account maken...", "Wachtwoorden komen niet overeen", "Account gemaakt. Controleer je e-mail.", "Verificatielink opnieuw verzonden.", "Registratie mislukt", "Registreer je restaurant"]],
  ["sv", ["Förnamn", "Efternamn", "Restaurangnamn", "Användarnamn", "Land", "Stad / region", "Adress", "Telefonnummer", "E-post", "Lösenord", "Bekräfta lösenord", "Skriv land för att söka", "Välj först land, sedan stad eller region", "Välj först ett land i listan.", "Välj stad eller region i listan.", "Jag godkänner", "Villkor", "Integritet", "Skapar konto...", "Lösenorden matchar inte", "Konto skapat. Kontrollera e-post.", "Verifieringslänk skickad igen.", "Registrering misslyckades", "Registrera din restaurang"]],
  ["el", ["Όνομα", "Επώνυμο", "Όνομα εστιατορίου", "Όνομα χρήστη", "Χώρα", "Πόλη / περιφέρεια", "Διεύθυνση", "Τηλέφωνο", "Email", "Κωδικός", "Επιβεβαίωση κωδικού", "Πληκτρολογήστε χώρα για αναζήτηση", "Επιλέξτε πρώτα χώρα, μετά πόλη ή περιφέρεια", "Επιλέξτε πρώτα χώρα από τη λίστα.", "Επιλέξτε πόλη ή περιφέρεια από τη λίστα.", "Συμφωνώ", "Όροι", "Απόρρητο", "Δημιουργία λογαριασμού...", "Οι κωδικοί δεν ταιριάζουν", "Ο λογαριασμός δημιουργήθηκε. Ελέγξτε email.", "Ο σύνδεσμος επαλήθευσης στάλθηκε ξανά.", "Η εγγραφή απέτυχε", "Εγγραφή εστιατορίου"]],
  ["vi", ["Tên", "Họ", "Tên nhà hàng", "Tên đăng nhập", "Quốc gia", "Thành phố / tỉnh", "Địa chỉ", "Số điện thoại", "Email", "Mật khẩu", "Xác nhận mật khẩu", "Nhập tên quốc gia để tìm", "Chọn quốc gia trước, rồi nhập thành phố hoặc tỉnh", "Trước tiên chọn quốc gia từ danh sách.", "Chọn thành phố hoặc tỉnh từ danh sách.", "Tôi đồng ý", "Điều khoản", "Quyền riêng tư", "Đang tạo tài khoản...", "Mật khẩu không khớp", "Tài khoản đã tạo. Kiểm tra email.", "Đã gửi lại liên kết xác minh.", "Đăng ký thất bại", "Đăng ký nhà hàng"]],
  ["th", ["ชื่อ", "นามสกุล", "ชื่อร้านอาหาร", "ชื่อผู้ใช้", "ประเทศ", "เมือง / จังหวัด", "ที่อยู่", "เบอร์โทรศัพท์", "อีเมล", "รหัสผ่าน", "ยืนยันรหัสผ่าน", "พิมพ์ชื่อประเทศเพื่อค้นหา", "เลือกประเทศก่อน แล้วพิมพ์เมืองหรือจังหวัด", "เลือกประเทศจากรายการก่อน", "เลือกเมืองหรือจังหวัดจากรายการ", "ฉันยอมรับ", "ข้อกำหนด", "ความเป็นส่วนตัว", "กำลังสร้างบัญชี...", "รหัสผ่านไม่ตรงกัน", "สร้างบัญชีแล้ว โปรดตรวจอีเมล", "ส่งลิงก์ยืนยันอีกครั้งแล้ว", "ลงทะเบียนไม่สำเร็จ", "ลงทะเบียนร้านอาหาร"]]
].map(([code, values]) => [code, registrationFromList(values as string[])]));

const extraLoginCopy: Record<string, LoginCopy> = Object.fromEntries([
  ["it", ["Email, username o telefono", "Password", "Accesso...", "Accesso non riuscito. Controlla i dati.", "Verifica l'email prima di accedere.", "Benvenuto. Reindirizzamento...", "Inserisci prima l'email.", "Invio link di verifica...", "Se serve verifica, e stato inviato un nuovo link.", "Impossibile inviare il link.", "Password dimenticata?", "Reinvia email di verifica"]],
  ["pt", ["Email, usuario ou telefone", "Senha", "Entrando...", "Nao foi possivel entrar. Verifique os dados.", "Verifique seu email antes de entrar.", "Bem-vindo. Redirecionando...", "Digite seu email primeiro.", "Enviando link de verificacao...", "Se este email precisar de verificacao, um novo link foi enviado.", "Nao foi possivel enviar o link.", "Esqueceu a senha?", "Reenviar email de verificacao"]],
  ["zh", ["邮箱、用户名或电话", "密码", "正在登录...", "无法登录。请检查信息。", "请先验证邮箱。", "欢迎，正在跳转...", "请先输入邮箱。", "正在发送验证链接...", "如需验证，新的链接已发送。", "无法发送验证链接。", "忘记密码？", "重新发送验证邮件"]],
  ["ja", ["メール、ユーザー名、電話", "パスワード", "ログイン中...", "ログインできません。入力内容を確認してください。", "ログイン前にメールを確認してください。", "ようこそ。移動します...", "先にメールを入力してください。", "確認リンクを送信中...", "確認が必要な場合、新しいリンクを送信しました。", "確認リンクを送信できません。", "パスワードを忘れましたか？", "確認メールを再送"]],
  ["ko", ["이메일, 사용자 이름 또는 전화", "비밀번호", "로그인 중...", "로그인할 수 없습니다. 정보를 확인하세요.", "로그인 전에 이메일을 인증하세요.", "환영합니다. 이동 중...", "먼저 이메일을 입력하세요.", "인증 링크 전송 중...", "인증이 필요하면 새 링크가 전송되었습니다.", "인증 링크를 보낼 수 없습니다.", "비밀번호를 잊으셨나요?", "인증 이메일 다시 보내기"]],
  ["hi", ["ईमेल, उपयोगकर्ता नाम या फोन", "पासवर्ड", "साइन इन हो रहा है...", "साइन इन नहीं हुआ। विवरण जांचें।", "साइन इन से पहले ईमेल सत्यापित करें।", "स्वागत है। रीडायरेक्ट हो रहा है...", "पहले ईमेल दर्ज करें।", "सत्यापन लिंक भेजा जा रहा है...", "यदि सत्यापन चाहिए, नया लिंक भेजा गया।", "लिंक नहीं भेजा जा सका।", "पासवर्ड भूल गए?", "सत्यापन ईमेल फिर भेजें"]],
  ["ur", ["ای میل، صارف نام یا فون", "پاس ورڈ", "لاگ ان ہو رہا ہے...", "لاگ ان نہیں ہو سکا۔ معلومات چیک کریں۔", "لاگ ان سے پہلے ای میل تصدیق کریں۔", "خوش آمدید۔ منتقل کیا جا رہا ہے...", "پہلے ای میل درج کریں۔", "تصدیقی لنک بھیجا جا رہا ہے...", "اگر تصدیق چاہیے تو نیا لنک بھیج دیا گیا۔", "لنک نہیں بھیجا جا سکا۔", "پاس ورڈ بھول گئے؟", "تصدیقی ای میل دوبارہ بھیجیں"]],
  ["fa", ["ایمیل، نام کاربری یا تلفن", "رمز عبور", "در حال ورود...", "ورود انجام نشد. اطلاعات را بررسی کنید.", "قبل از ورود ایمیل را تأیید کنید.", "خوش آمدید. در حال انتقال...", "ابتدا ایمیل را وارد کنید.", "در حال ارسال لینک تأیید...", "اگر نیاز به تأیید باشد، لینک جدید ارسال شد.", "ارسال لینک ممکن نبود.", "رمز عبور را فراموش کرده‌اید؟", "ارسال دوباره ایمیل تأیید"]],
  ["he", ["אימייל, שם משתמש או טלפון", "סיסמה", "מתחבר...", "לא ניתן להתחבר. בדוק פרטים.", "אמת אימייל לפני התחברות.", "ברוך הבא. מעביר...", "הזן קודם אימייל.", "שולח קישור אימות...", "אם נדרש אימות, קישור חדש נשלח.", "לא ניתן לשלוח קישור.", "שכחת סיסמה?", "שלח אימייל אימות שוב"]],
  ["id", ["Email, nama pengguna, atau telepon", "Kata sandi", "Masuk...", "Tidak dapat masuk. Periksa data.", "Verifikasi email sebelum masuk.", "Selamat datang. Mengalihkan...", "Masukkan email dulu.", "Mengirim tautan verifikasi...", "Jika perlu verifikasi, tautan baru dikirim.", "Tidak dapat mengirim tautan.", "Lupa kata sandi?", "Kirim ulang email verifikasi"]],
  ["ms", ["E-mel, nama pengguna atau telefon", "Kata laluan", "Sedang masuk...", "Tidak dapat masuk. Semak butiran.", "Sahkan e-mel sebelum masuk.", "Selamat datang. Mengalih...", "Masukkan e-mel dahulu.", "Menghantar pautan pengesahan...", "Jika perlu pengesahan, pautan baharu dihantar.", "Tidak dapat menghantar pautan.", "Lupa kata laluan?", "Hantar semula e-mel pengesahan"]],
  ["uk", ["Email, ім'я користувача або телефон", "Пароль", "Вхід...", "Не вдалося увійти. Перевірте дані.", "Підтвердьте email перед входом.", "Вітаємо. Перенаправлення...", "Спочатку введіть email.", "Надсилання посилання...", "Якщо потрібне підтвердження, нове посилання надіслано.", "Не вдалося надіслати посилання.", "Забули пароль?", "Надіслати підтвердження ще раз"]],
  ["pl", ["Email, użytkownik lub telefon", "Hasło", "Logowanie...", "Nie można się zalogować. Sprawdź dane.", "Potwierdź email przed logowaniem.", "Witamy. Przekierowanie...", "Najpierw wpisz email.", "Wysyłanie linku...", "Jeśli email wymaga weryfikacji, wysłano nowy link.", "Nie można wysłać linku.", "Nie pamiętasz hasła?", "Wyślij email weryfikacyjny ponownie"]],
  ["nl", ["E-mail, gebruikersnaam of telefoon", "Wachtwoord", "Inloggen...", "Kan niet inloggen. Controleer gegevens.", "Verifieer je e-mail voor inloggen.", "Welkom. Doorsturen...", "Voer eerst e-mail in.", "Verificatielink verzenden...", "Als verificatie nodig is, is een nieuwe link verzonden.", "Kan link niet verzenden.", "Wachtwoord vergeten?", "Verificatie-e-mail opnieuw sturen"]],
  ["sv", ["E-post, användarnamn eller telefon", "Lösenord", "Loggar in...", "Kunde inte logga in. Kontrollera uppgifter.", "Verifiera e-post före inloggning.", "Välkommen. Omdirigerar...", "Ange e-post först.", "Skickar verifieringslänk...", "Om verifiering krävs har ny länk skickats.", "Kunde inte skicka länk.", "Glömt lösenord?", "Skicka verifieringsmejl igen"]],
  ["el", ["Email, όνομα χρήστη ή τηλέφωνο", "Κωδικός", "Σύνδεση...", "Δεν ήταν δυνατή η σύνδεση. Ελέγξτε τα στοιχεία.", "Επαληθεύστε email πριν τη σύνδεση.", "Καλώς ήρθατε. Ανακατεύθυνση...", "Πρώτα εισαγάγετε email.", "Αποστολή συνδέσμου...", "Αν απαιτείται επαλήθευση, στάλθηκε νέος σύνδεσμος.", "Δεν ήταν δυνατή η αποστολή.", "Ξεχάσατε κωδικό;", "Αποστολή email επαλήθευσης ξανά"]],
  ["vi", ["Email, tên đăng nhập hoặc điện thoại", "Mật khẩu", "Đang đăng nhập...", "Không thể đăng nhập. Kiểm tra thông tin.", "Xác minh email trước khi đăng nhập.", "Chào mừng. Đang chuyển...", "Nhập email trước.", "Đang gửi liên kết xác minh...", "Nếu cần xác minh, liên kết mới đã được gửi.", "Không thể gửi liên kết.", "Quên mật khẩu?", "Gửi lại email xác minh"]],
  ["th", ["อีเมล ชื่อผู้ใช้ หรือโทรศัพท์", "รหัสผ่าน", "กำลังเข้าสู่ระบบ...", "เข้าสู่ระบบไม่ได้ โปรดตรวจข้อมูล", "ยืนยันอีเมลก่อนเข้าสู่ระบบ", "ยินดีต้อนรับ กำลังเปลี่ยนหน้า...", "กรอกอีเมลก่อน", "กำลังส่งลิงก์ยืนยัน...", "หากต้องยืนยัน ได้ส่งลิงก์ใหม่แล้ว", "ส่งลิงก์ไม่ได้", "ลืมรหัสผ่าน?", "ส่งอีเมลยืนยันอีกครั้ง"]]
].map(([code, values]) => [code, loginFromList(values as string[])]));

function registrationFromList(values: string[]): RegistrationCopy {
  return {
    firstName: values[0] ?? "", lastName: values[1] ?? "", restaurantName: values[2] ?? "", username: values[3] ?? "",
    country: values[4] ?? "", city: values[5] ?? "", address: values[6] ?? "", phone: values[7] ?? "", email: values[8] ?? "",
    password: values[9] ?? "", confirmPassword: values[10] ?? "", selectCountry: values[11] ?? "", selectCity: values[12] ?? "",
    countryRequired: values[13] ?? "", cityRequired: values[14] ?? "", consent: values[15] ?? "", terms: values[16] ?? "",
    privacy: values[17] ?? "", creating: values[18] ?? "", mismatch: values[19] ?? "", created: values[20] ?? "",
    resent: values[21] ?? "", failed: values[22] ?? "", submitRestaurant: values[23] ?? ""
  };
}

function loginFromList(values: string[]): LoginCopy {
  return {
    identifier: values[0] ?? "", password: values[1] ?? "", signingIn: values[2] ?? "", failed: values[3] ?? "",
    verificationRequired: values[4] ?? "", welcome: values[5] ?? "", enterEmail: values[6] ?? "",
    sendingVerification: values[7] ?? "", resent: values[8] ?? "", resendFailed: values[9] ?? "",
    forgotPassword: values[10] ?? "", resendVerification: values[11] ?? ""
  };
}

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
  const copy = loginCopy[preferredLanguage as keyof typeof loginCopy] ?? extraLoginCopy[preferredLanguage] ?? loginCopy.en;

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
      <a className="auth-inline-link" href={`/reset-password?lang=${preferredLanguage}`}>
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
  const [countryCode, setCountryCode] = useState("");
  const [city, setCity] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [activeLocationSearch, setActiveLocationSearch] = useState<"country" | "city" | null>(null);
  const copy = registrationCopy[preferredLanguage as keyof typeof registrationCopy] ?? extraRegistrationCopy[preferredLanguage] ?? registrationCopy.en;
  const selectedCountry = countryCode ? allCountries.find((country) => country.isoCode === countryCode) : undefined;
  const locationOptions = useMemo(() => (countryCode ? getLocationOptions(countryCode, preferredLanguage) : []), [countryCode, preferredLanguage]);
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
    setCitySearch(locationOptions[0]?.label ?? "");
  }, [locationOptions]);

  useEffect(() => {
    setCountrySearch(selectedCountry ? formatCountryName(selectedCountry, preferredLanguage) : "");
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
    else setCountrySearch(selectedCountry ? formatCountryName(selectedCountry, preferredLanguage) : "");
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
            disabled={!selectedCountry}
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
            <span>{selectedCountry?.dialCode ?? "--"}</span>
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
