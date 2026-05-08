import { getLanguages, getPublicPage } from "../lib/api";
import {
  LoginSection,
  RegistrationSection,
} from "./components/auth/AuthSections";
import { LoginForm } from "./components/auth/LoginForm";
import { RegistrationForm } from "./components/auth/RegistrationForm";
import { LanguageBootstrap } from "./components/language/LanguageBootstrap";
import { PublicHeader } from "./components/layout/PublicHeader";
import { FeaturesSection } from "./sections/features/FeaturesSection";
import { HeroSection } from "./sections/hero/HeroSection";
import { PartnerNetworkSection } from "./sections/partner-network/PartnerNetworkSection";
import { PricingSection } from "./sections/pricing/PricingSection";
import { PublicDashboardPreview } from "./sections/public-dashboard-preview/PublicDashboardPreview";
import { RestaurantPortalSection } from "./sections/restaurant-portal/RestaurantPortalSection";
import { getPartnerContent } from "./lib/partner-copy";
import { getPublicFallbackCopy } from "./lib/public-fallback-copy";
import { buildLanguageOptions } from "./lib/public-page";
import styles from "./page.module.scss";

interface PublicHomePageProps {
  searchParams?: Promise<{
    lang?: string;
  }>;
}

export default async function PublicHomePage({
  searchParams,
}: PublicHomePageProps) {
  const params = await searchParams;
  const language = params?.lang ?? "en";
  const [content, remoteLanguages] = await Promise.all([
    getPublicPage(language),
    getLanguages(),
  ]);
  const direction = content.direction === "rtl" ? "rtl" : "ltr";
  const languages = buildLanguageOptions(remoteLanguages);
  const fallbackCopy = getPublicFallbackCopy(language);

  return (
    <main className={styles.page} dir={direction}>
      <LanguageBootstrap fallbackLanguage={language} languages={languages} />
      <PublicHeader
        content={content}
        customerOrderLabel={fallbackCopy.customerOrder}
        language={language}
        languages={languages}
      />
      <HeroSection direction={direction} hero={content.hero} />
      <FeaturesSection
        about={content.about}
        cards={content.featureCards}
        eyebrow={content.brandName}
      />
      <PricingSection
        actionLabel={content.hero.primaryAction}
        eyebrow={content.nav.pricing}
        plans={content.pricing}
        title={fallbackCopy.plansTitle}
      />
      <PublicDashboardPreview about={content.about} />
      <RestaurantPortalSection
        portal={content.restaurantPortal}
        subtitle={content.hero.subtitle}
      />
      <PartnerNetworkSection content={getPartnerContent(language)} />
      <LoginSection>
        <LoginForm
          loginLabel={content.nav.login}
          preferredLanguage={language}
        />
      </LoginSection>
      <RegistrationSection>
        <RegistrationForm
          preferredLanguage={language}
          registrationLabel={content.nav.registration}
          restaurantLabel={content.nav.restaurant}
        />
      </RegistrationSection>
    </main>
  );
}
