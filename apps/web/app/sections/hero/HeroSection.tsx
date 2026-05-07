import { PrimaryButton } from "../../components/buttons/PrimaryButton";
import { SecondaryButton } from "../../components/buttons/SecondaryButton";
import type { PublicPageContent } from "../../lib/public-page";
import styles from "./HeroSection.module.scss";

interface HeroSectionProps {
  direction: "ltr" | "rtl";
  hero: PublicPageContent["hero"];
}

export function HeroSection({ direction, hero }: HeroSectionProps) {
  return (
    <section className={styles.hero} dir={direction}>
      <div
        className={styles.media}
        style={{ backgroundImage: `url(${hero.imageUrl})` }}
      />
      <div className={styles.content}>
        <p>{hero.eyebrow}</p>
        <h1>{hero.title}</h1>
        <span>{hero.subtitle}</span>
        <div className={styles.actions}>
          <PrimaryButton href="#registration">
            {hero.primaryAction}
          </PrimaryButton>
          <SecondaryButton href="#features">
            {hero.secondaryAction}
          </SecondaryButton>
        </div>
      </div>
    </section>
  );
}
