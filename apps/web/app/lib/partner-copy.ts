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

// TODO: Move partner copy to translation-service.
const partnerContent: Record<string, PartnerContent> = {
  ar: {
    eyebrow: "شبكة شركاء بابلي",
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
    eyebrow: "Babili partner network",
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

export function getPartnerContent(language: string) {
  return partnerContent[language] ?? partnerContent.en!;
}
