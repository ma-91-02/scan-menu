import cors from "cors";
import express from "express";
import type { LanguageCode, LocalizedPublicPageContent, PublicPageContent } from "@scanmenu/shared";
import { pickLocalizedText, supportedLanguages } from "@scanmenu/shared";

const phrasebook: Record<string, Partial<Record<LanguageCode, string>>> = {
  "no onions": {
    ar: "بدون بصل",
    en: "no onions",
    ru: "без лука",
    tr: "soğansız",
    fr: "sans oignons"
  },
  spicy: {
    ar: "حار",
    en: "spicy",
    ru: "острое",
    tr: "acı",
    fr: "epice"
  }
};

let publicPageContent: PublicPageContent = {
  id: "public-home",
  brandName: {
    ar: "Scan Menu",
    en: "Scan Menu",
    ru: "Scan Menu"
  },
  nav: {
    home: {
      ar: "الرئيسية",
      en: "Home",
      ru: "Главная",
      tr: "Ana sayfa",
      fr: "Accueil",
      es: "Inicio",
      de: "Start",
      zh: "首页"
    },
    pricing: {
      ar: "الأسعار",
      en: "Pricing",
      ru: "Цена",
      tr: "Fiyat",
      fr: "Tarifs",
      es: "Precios",
      de: "Preise",
      zh: "价格"
    },
    about: {
      ar: "من نحن",
      en: "About",
      ru: "О нас",
      tr: "Hakkımızda",
      fr: "À propos",
      es: "Nosotros",
      de: "Über uns",
      zh: "关于我们"
    },
    login: {
      ar: "دخول",
      en: "Login",
      ru: "Войти",
      tr: "Giriş",
      fr: "Connexion",
      es: "Iniciar sesión",
      de: "Anmelden",
      zh: "登录"
    },
    registration: {
      ar: "تسجيل",
      en: "Registration",
      ru: "Регистрация",
      tr: "Kayıt",
      fr: "Inscription",
      es: "Registro",
      de: "Registrierung",
      zh: "注册"
    },
    restaurant: {
      ar: "مطعمك",
      en: "Your Restaurant",
      ru: "Твой ресторан",
      tr: "Restoranın",
      fr: "Votre restaurant",
      es: "Tu restaurante",
      de: "Dein Restaurant",
      zh: "你的餐厅"
    }
  },
  hero: {
    eyebrow: {
      ar: "منصة مطاعم متعددة اللغات",
      en: "Multilingual restaurant platform",
      ru: "Многоязычная ресторанная платформа"
    },
    title: {
      ar: "اجعل كل زائر يطلب بلغته، واجعل مطعمك يستقبل الطلب بلغته.",
      en: "Let every guest order in their language, while your restaurant receives it in yours.",
      ru: "Гость заказывает на своем языке, ресторан получает заказ на своем."
    },
    subtitle: {
      ar: "Scan Menu تربط العملاء والمطاعم عبر ترجمة مركزية، إدارة قوائم، طلبات مباشرة، وصلاحيات للموظفين والمحاسبين وأصحاب المطاعم.",
      en: "Scan Menu connects guests and restaurants with central translation, menu management, live orders, and roles for staff, accountants, and owners.",
      ru: "Scan Menu объединяет гостей и рестораны: переводы, меню, заказы и роли для сотрудников, бухгалтеров и владельцев."
    },
    primaryAction: { ar: "ابدأ لمطعمك", en: "Start your restaurant", ru: "Начать для ресторана" },
    secondaryAction: { ar: "شاهد المزايا", en: "Explore features", ru: "Посмотреть функции" },
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80"
  },
  featureCards: [
    {
      id: "translation",
      title: {
        ar: "ترجمة الطلبات",
        en: "Order translation",
        ru: "Перевод заказов"
      },
      description: {
        ar: "العميل يكتب ملاحظته بلغته، والمطبخ يستلمها بلغة المطعم.",
        en: "Guests write notes in their language; the kitchen receives them in the restaurant language.",
        ru: "Гость пишет комментарий на своем языке, кухня получает его на языке ресторана."
      },
      imageUrl:
        "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "operations",
      title: {
        ar: "تشغيل المطعم",
        en: "Restaurant operations",
        ru: "Управление рестораном"
      },
      description: {
        ar: "إدارة القوائم، الموظفين، الكاشير، المطبخ، الفروع، وخدمات التوصيل.",
        en: "Manage menus, staff, cashier, kitchen, branches, and delivery services.",
        ru: "Меню, сотрудники, касса, кухня, филиалы и службы доставки в одном месте."
      },
      imageUrl:
        "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "analytics",
      title: {
        ar: "محاسبة ورقابة",
        en: "Accounting and control",
        ru: "Финансы и контроль"
      },
      description: {
        ar: "صلاحيات للمحاسبين وتقارير تساعد مالك المطعم ومالك المنصة.",
        en: "Accountant roles and reports for restaurant owners and platform ownership.",
        ru: "Роли бухгалтеров и отчеты для владельцев ресторанов и платформы."
      },
      imageUrl:
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80"
    }
  ],
  pricing: [
    {
      id: "basic",
      name: { ar: "Basic", en: "Basic", ru: "Basic" },
      price: { ar: "0 / شهر", en: "0 / mo", ru: "0 / мес" },
      features: [
        { ar: "10 أصناف في القائمة", en: "10 menu items", ru: "10 позиций меню" },
        { ar: "إدارة 5 موظفين", en: "Manage 5 employees", ru: "5 сотрудников" }
      ]
    },
    {
      id: "standard",
      name: { ar: "Standard", en: "Standard", ru: "Standard" },
      price: { ar: "19.99$ / شهر", en: "$19.99 / mo", ru: "19.99$ / мес" },
      features: [
        { ar: "25 صنفًا في القائمة", en: "25 menu items", ru: "25 позиций меню" },
        { ar: "إدارة 15 موظفًا", en: "Manage 15 employees", ru: "15 сотрудников" }
      ]
    },
    {
      id: "premium",
      name: { ar: "Premium", en: "Premium", ru: "Premium" },
      price: { ar: "29.99$ / شهر", en: "$29.99 / mo", ru: "29.99$ / мес" },
      features: [
        { ar: "موظفون وقوائم غير محدودة", en: "Unlimited staff and menu items", ru: "Безлимитные сотрудники и меню" },
        { ar: "تقارير ومراقبة", en: "Reports and monitoring", ru: "Отчеты и мониторинг" }
      ]
    }
  ],
  about: {
    title: {
      ar: "Scan Menu ليست صفحة تعريف فقط، بل نظام تشغيل للمطاعم.",
      en: "Scan Menu is not only a website. It is an operating system for restaurants.",
      ru: "Scan Menu - не просто сайт, а операционная система для ресторанов."
    },
    body: {
      ar: "يمكن لمالك المنصة التحكم بمحتوى الصفحة العامة، اللغات، الأسعار، وواجهات المطاعم من لوحة التحكم.",
      en: "The platform owner can control public content, languages, pricing, and restaurant-facing areas from the dashboard.",
      ru: "Владелец платформы управляет контентом, языками, тарифами и ресторанными разделами из панели."
    }
  },
  restaurantPortal: {
    title: {
      ar: "منطقة مطعمك",
      en: "Your restaurant area",
      ru: "Зона ресторана"
    },
    menuItems: [
      { ar: "الملف الشخصي", en: "Profile", ru: "Профиль" },
      { ar: "تغيير الخطة", en: "Change plan", ru: "Изменить план" },
      { ar: "القائمة", en: "Menu", ru: "Меню" },
      { ar: "الموظفون", en: "Employees", ru: "Сотрудники" },
      { ar: "المطبخ", en: "Kitchen", ru: "Кухня" },
      { ar: "الكاشير", en: "Cashier", ru: "Кассир" },
      { ar: "اللغات", en: "Languages", ru: "Языки" },
      { ar: "المالية", en: "Finance", ru: "Финансы" }
    ]
  },
  updatedAt: new Date().toISOString()
};

const app = express();
const port = Number(process.env.TRANSLATION_SERVICE_PORT ?? 4104);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ data: { service: "translation-service", status: "ok" } });
});

app.get("/languages", (_req, res) => {
  res.json({ data: supportedLanguages });
});

app.get("/public-page/raw", (_req, res) => {
  res.json({ data: publicPageContent });
});

app.get("/public-page", (req, res) => {
  const language = String(req.query.language ?? "en");
  const direction =
    supportedLanguages.find((item) => item.code === language)?.direction ??
    (["ar", "fa", "he", "ur"].includes(language) ? "rtl" : "ltr");

  const localized: LocalizedPublicPageContent = {
    id: publicPageContent.id,
    brandName: pickLocalizedText(publicPageContent.brandName, language),
    nav: {
      home: pickLocalizedText(publicPageContent.nav.home, language),
      pricing: pickLocalizedText(publicPageContent.nav.pricing, language),
      about: pickLocalizedText(publicPageContent.nav.about, language),
      login: pickLocalizedText(publicPageContent.nav.login, language),
      registration: pickLocalizedText(publicPageContent.nav.registration, language),
      restaurant: pickLocalizedText(publicPageContent.nav.restaurant, language)
    },
    hero: {
      eyebrow: pickLocalizedText(publicPageContent.hero.eyebrow, language),
      title: pickLocalizedText(publicPageContent.hero.title, language),
      subtitle: pickLocalizedText(publicPageContent.hero.subtitle, language),
      primaryAction: pickLocalizedText(publicPageContent.hero.primaryAction, language),
      secondaryAction: pickLocalizedText(publicPageContent.hero.secondaryAction, language),
      imageUrl: publicPageContent.hero.imageUrl
    },
    featureCards: publicPageContent.featureCards.map((card) => ({
      id: card.id,
      title: pickLocalizedText(card.title, language),
      description: pickLocalizedText(card.description, language),
      imageUrl: card.imageUrl
    })),
    pricing: publicPageContent.pricing.map((plan) => ({
      id: plan.id,
      name: pickLocalizedText(plan.name, language),
      price: pickLocalizedText(plan.price, language),
      features: plan.features.map((feature) => pickLocalizedText(feature, language))
    })),
    about: {
      title: pickLocalizedText(publicPageContent.about.title, language),
      body: pickLocalizedText(publicPageContent.about.body, language)
    },
    restaurantPortal: {
      title: pickLocalizedText(publicPageContent.restaurantPortal.title, language),
      menuItems: publicPageContent.restaurantPortal.menuItems.map((item) =>
        pickLocalizedText(item, language)
      )
    },
    language,
    direction,
    updatedAt: publicPageContent.updatedAt
  };

  res.json({ data: localized });
});

app.put("/public-page", (req, res) => {
  publicPageContent = {
    ...publicPageContent,
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  res.json({ data: publicPageContent });
});

app.post("/translate", (req, res) => {
  const text = String(req.body.text ?? "").trim().toLowerCase();
  const targetLanguage = (req.body.targetLanguage ?? "en") as LanguageCode;
  const translatedText = phrasebook[text]?.[targetLanguage] ?? `[${targetLanguage}] ${text}`;

  res.json({
    data: {
      sourceText: req.body.text,
      sourceLanguage: req.body.sourceLanguage ?? "auto",
      targetLanguage,
      translatedText,
      provider: phrasebook[text] ? "scanmenu-phrasebook" : "placeholder"
    }
  });
});

app.listen(port, () => {
  console.log(`Translation service listening on http://localhost:${port}`);
});
