import { LanguageSelect } from "../language/LanguageSelect";
import type { LanguageOption, PublicPageContent } from "../../lib/public-page";
import styles from "./PublicHeader.module.scss";

interface PublicHeaderProps {
  content: PublicPageContent;
  customerOrderLabel: string;
  language: string;
  languages: LanguageOption[];
}

export function PublicHeader({
  content,
  customerOrderLabel,
  language,
  languages,
}: PublicHeaderProps) {
  return (
    <header className={styles.header}>
      <a className={styles.brand} href={`/?lang=${language}`}>
        {content.brandName}
      </a>

      <nav className={styles.links} aria-label="Public navigation">
        <a href={`/?lang=${language}`}>{content.nav.home}</a>
        <a href="#pricing">{content.nav.pricing}</a>
        <a href="#about">{content.nav.about}</a>
        <a href="#login">{content.nav.login}</a>
        <a href="#registration">{content.nav.registration}</a>
        <a href={`/customer?lang=${language}`}>{customerOrderLabel}</a>
        <a href="#restaurant">{content.nav.restaurant}</a>
      </nav>

      <LanguageSelect currentLanguage={language} languages={languages} />
    </header>
  );
}
