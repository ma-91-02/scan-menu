import type {
  LocalizedPublicPageContent,
  SupportedLanguage,
} from "@scanmenu/shared";

export interface LanguageOption {
  code: string;
  nativeName: string;
  flag: string;
}

export interface PartnerCardContent {
  icon: string;
  title: string;
  body: string;
  action: string;
}

export interface PartnerContent {
  eyebrow: string;
  title: string;
  body: string;
  cards: PartnerCardContent[];
}

export type PublicPageContent = LocalizedPublicPageContent;

const rtlLanguages = new Set(["ar", "ur", "fa", "he"]);

const publicFallbackCopy: Record<
  string,
  { customerOrder: string; plansTitle: string }
> = {
  ar: { customerOrder: "طلب الزبون", plansTitle: "خطط Scan Menu" },
  en: { customerOrder: "Customer order", plansTitle: "Scan Menu plans" },
  ru: { customerOrder: "Заказ клиента", plansTitle: "Тарифы Scan Menu" },
  tr: { customerOrder: "Müşteri siparişi", plansTitle: "Scan Menu planları" },
  fr: { customerOrder: "Commande client", plansTitle: "Offres Scan Menu" },
  es: { customerOrder: "Pedido del cliente", plansTitle: "Planes Scan Menu" },
  de: { customerOrder: "Kundenbestellung", plansTitle: "Scan Menu Tarife" },
};

const partnerContent: Record<string, PartnerContent> = {
  ar: {
    eyebrow: "شبكة شركاء Scan Menu",
    title: "مسارات دخول واضحة لكل من يخدم المطاعم",
    body: "يمكن لسائقي التوصيل، المزارعين، وأصحاب البقالة أو الموردين الدخول بحساباتهم الخاصة ومتابعة الطلبات والعروض والتوريد حسب صلاحياتهم.",
    cards: [
      {
        icon: "🚚",
        title: "سائقو التوصيل",
        body: "استلام طلبات التوصيل، تحديث الحالة، ومعرفة وجهات الطلبات من حساب واحد.",
        action: "دخول السائق",
      },
      {
        icon: "🌾",
        title: "المزارعون",
        body: "عرض المنتجات الطازجة للمطاعم، استقبال طلبات التوريد، ومتابعة الكميات.",
        action: "دخول المزارع",
      },
      {
        icon: "🛒",
        title: "البقالات والموردون",
        body: "إدارة كتالوج المواد، عروض التوريد، ومتابعة طلبات المطاعم اليومية.",
        action: "دخول المورد",
      },
    ],
  },
  en: {
    eyebrow: "Scan Menu partner network",
    title: "Dedicated access for everyone who serves restaurants",
    body: "Delivery drivers, farmers, grocery owners, and suppliers can sign in to role-based workspaces for deliveries, supply, and restaurant procurement.",
    cards: [
      {
        icon: "🚚",
        title: "Delivery drivers",
        body: "Receive delivery tasks, update progress, and track destinations from one account.",
        action: "Driver login",
      },
      {
        icon: "🌾",
        title: "Farmers",
        body: "Offer fresh products to restaurants, receive supply requests, and manage quantities.",
        action: "Farmer login",
      },
      {
        icon: "🛒",
        title: "Grocers and suppliers",
        body: "Manage item catalogs, supplier offers, and restaurant purchase requests.",
        action: "Supplier login",
      },
    ],
  },
};

export function isRtlLanguage(language: string) {
  return rtlLanguages.has(language);
}

export function buildLanguageOptions(
  languages: SupportedLanguage[],
): LanguageOption[] {
  return languages.map((item) => ({
    code: String(item.code),
    nativeName: item.nativeName,
    flag: flagForLanguage(String(item.code)),
  }));
}

export function getPublicFallbackCopy(language: string) {
  return publicFallbackCopy[language] ?? publicFallbackCopy.en!;
}

export function getPartnerContent(language: string) {
  return partnerContent[language] ?? partnerContent.en!;
}

export function flagForLanguage(language: string) {
  const flags: Record<string, string> = {
    ar: "🇸🇦",
    en: "🇺🇸",
    ru: "🇷🇺",
    tr: "🇹🇷",
    fr: "🇫🇷",
    es: "🇪🇸",
    de: "🇩🇪",
    it: "🇮🇹",
    pt: "🇵🇹",
    zh: "🇨🇳",
    ja: "🇯🇵",
    ko: "🇰🇷",
    hi: "🇮🇳",
    ur: "🇵🇰",
    fa: "🇮🇷",
    he: "🇮🇱",
    id: "🇮🇩",
    ms: "🇲🇾",
    uk: "🇺🇦",
    pl: "🇵🇱",
    nl: "🇳🇱",
    sv: "🇸🇪",
    el: "🇬🇷",
    vi: "🇻🇳",
    th: "🇹🇭",
  };

  return flags[language] ?? "🌐";
}
