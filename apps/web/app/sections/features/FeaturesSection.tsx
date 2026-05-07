import { FeatureCard } from "../../components/cards/FeatureCard";
import { SectionHeading } from "../../components/layout/SectionHeading";
import type { PublicPageContent } from "../../lib/public-page";
import styles from "./FeaturesSection.module.scss";

interface FeaturesSectionProps {
  about: PublicPageContent["about"];
  cards: PublicPageContent["featureCards"];
}

export function FeaturesSection({ about, cards }: FeaturesSectionProps) {
  return (
    <section className={styles.section} id="features">
      <SectionHeading
        eyebrow="Scan Menu"
        title={about.title}
        body={about.body}
      />
      <div className={styles.grid}>
        {cards.map((card) => (
          <FeatureCard
            key={card.id}
            title={card.title}
            description={card.description}
            imageUrl={card.imageUrl}
          />
        ))}
      </div>
    </section>
  );
}
