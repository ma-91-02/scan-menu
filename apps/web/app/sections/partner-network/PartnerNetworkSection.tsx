import { PrimaryButton } from "../../components/buttons/PrimaryButton";
import { SectionHeading } from "../../components/layout/SectionHeading";
import type { PartnerContent } from "../../lib/partner-copy";
import styles from "./PartnerNetworkSection.module.scss";

interface PartnerNetworkSectionProps {
  content: PartnerContent;
}

export function PartnerNetworkSection({ content }: PartnerNetworkSectionProps) {
  return (
    <section className={styles.section} id="partners">
      <SectionHeading
        eyebrow={content.eyebrow}
        title={content.title}
        body={content.body}
      />
      <div className={styles.grid}>
        {content.cards.map((card) => (
          <article className={styles.card} key={card.title}>
            <span>{card.icon}</span>
            <h3>{card.title}</h3>
            <p>{card.body}</p>
            <PrimaryButton href="#login">{card.action}</PrimaryButton>
          </article>
        ))}
      </div>
    </section>
  );
}
