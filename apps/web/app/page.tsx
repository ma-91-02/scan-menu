import { supportedLanguages } from "@menuza/shared";
import { getPublicPage } from "../lib/api";
import { LanguageBootstrap, LanguageSelect, LoginForm, RegistrationForm } from "./public-actions";

interface PublicHomePageProps {
  searchParams?: Promise<{
    lang?: string;
  }>;
}

export default async function PublicHomePage({ searchParams }: PublicHomePageProps) {
  const params = await searchParams;
  const language = params?.lang ?? "en";
  const content = await getPublicPage(language);
  const isRtl = content.direction === "rtl";
  const languages = supportedLanguages.map((item) => ({
    code: String(item.code),
    nativeName: item.nativeName,
    flag: flagForLanguage(String(item.code))
  }));

  return (
    <main className="public-page" dir={isRtl ? "rtl" : "ltr"}>
      <LanguageBootstrap fallbackLanguage={language} languages={languages} />
      <header className="public-nav">
        <a className="public-brand" href={`/?lang=${language}`}>
          {content.brandName}
        </a>

        <nav className="public-links" aria-label="Public navigation">
          <a href={`/?lang=${language}`}>{content.nav.home}</a>
          <a href={`#pricing`}>{content.nav.pricing}</a>
          <a href={`#about`}>{content.nav.about}</a>
          <a href={`#login`}>{content.nav.login}</a>
          <a href={`#registration`}>{content.nav.registration}</a>
          <a href={`/customer?lang=${language}`}>{language === "ar" ? "طلب الزبون" : "Customer order"}</a>
          <a href={`#restaurant`}>{content.nav.restaurant}</a>
        </nav>

        <LanguageSelect
          currentLanguage={language}
          languages={languages}
        />
      </header>

      <section className="public-hero">
        <div className="hero-media" style={{ backgroundImage: `url(${content.hero.imageUrl})` }} />
        <div className="hero-content">
          <p>{content.hero.eyebrow}</p>
          <h1>{content.hero.title}</h1>
          <span>{content.hero.subtitle}</span>
          <div className="hero-actions">
            <a className="public-button primary" href="#registration">
              {content.hero.primaryAction}
            </a>
            <a className="public-button secondary" href="#features">
              {content.hero.secondaryAction}
            </a>
          </div>
        </div>
      </section>

      <section className="public-band" id="features">
        <div className="section-heading">
          <span>Menuza</span>
          <h2>{content.about.title}</h2>
          <p>{content.about.body}</p>
        </div>

        <div className="feature-grid">
          {content.featureCards.map((card) => (
            <article className="feature-card" key={card.id}>
              <div className="feature-image" style={{ backgroundImage: `url(${card.imageUrl})` }} />
              <div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="section-heading">
          <span>{content.nav.pricing}</span>
          <h2>Menuza plans</h2>
        </div>

        <div className="pricing-grid">
          {content.pricing.map((plan) => (
            <article className="pricing-card" key={plan.id}>
              <h3>{plan.name}</h3>
              <strong>{plan.price}</strong>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <a className="public-button primary" href="#registration">
                {content.hero.primaryAction}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section" id="about">
        <h2>{content.about.title}</h2>
        <p>{content.about.body}</p>
      </section>

      <section className="portal-section" id="restaurant">
        <aside>
          <h2>{content.restaurantPortal.title}</h2>
          <p>{content.hero.subtitle}</p>
        </aside>
        <div className="portal-menu">
          {content.restaurantPortal.menuItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="partner-section" id="partners">
        <div className="section-heading">
          <span>{partnerCopy(language).eyebrow}</span>
          <h2>{partnerCopy(language).title}</h2>
          <p>{partnerCopy(language).body}</p>
        </div>

        <div className="partner-grid">
          {partnerCopy(language).cards.map((card) => (
            <article className="partner-card" key={card.title}>
              <span>{card.icon}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
              <a className="public-button primary" href="#login">
                {card.action}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="auth-section" id="login">
        <LoginForm loginLabel={content.nav.login} />
      </section>

      <section className="registration-section" id="registration">
        <RegistrationForm
          preferredLanguage={language}
          registrationLabel={content.nav.registration}
          restaurantLabel={content.nav.restaurant}
        />
      </section>
    </main>
  );
}

function partnerCopy(language: string) {
  if (language === "ar") {
    return {
      eyebrow: "شبكة شركاء Menuza",
      title: "مسارات دخول واضحة لكل من يخدم المطاعم",
      body:
        "يمكن لسائقي التوصيل، المزارعين، وأصحاب البقالة أو الموردين الدخول بحساباتهم الخاصة ومتابعة الطلبات والعروض والتوريد حسب صلاحياتهم.",
      cards: [
        {
          icon: "🚚",
          title: "سائقو التوصيل",
          body: "استلام طلبات التوصيل، تحديث الحالة، ومعرفة وجهات الطلبات من حساب واحد.",
          action: "دخول السائق"
        },
        {
          icon: "🌾",
          title: "المزارعون",
          body: "عرض المنتجات الطازجة للمطاعم، استقبال طلبات التوريد، ومتابعة الكميات.",
          action: "دخول المزارع"
        },
        {
          icon: "🛒",
          title: "البقالات والموردون",
          body: "إدارة كتالوج المواد، عروض التوريد، ومتابعة طلبات المطاعم اليومية.",
          action: "دخول المورد"
        }
      ]
    };
  }

  return {
    eyebrow: "Menuza partner network",
    title: "Dedicated access for everyone who serves restaurants",
    body:
      "Delivery drivers, farmers, grocery owners, and suppliers can sign in to role-based workspaces for deliveries, supply, and restaurant procurement.",
    cards: [
      {
        icon: "🚚",
        title: "Delivery drivers",
        body: "Receive delivery tasks, update progress, and track destinations from one account.",
        action: "Driver login"
      },
      {
        icon: "🌾",
        title: "Farmers",
        body: "Offer fresh products to restaurants, receive supply requests, and manage quantities.",
        action: "Farmer login"
      },
      {
        icon: "🛒",
        title: "Grocers and suppliers",
        body: "Manage item catalogs, supplier offers, and restaurant purchase requests.",
        action: "Supplier login"
      }
    ]
  };
}

function flagForLanguage(language: string) {
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
    th: "🇹🇭"
  };

  return flags[language] ?? "🌐";
}
