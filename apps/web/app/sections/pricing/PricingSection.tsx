import { PlanCard } from "../../components/cards/PlanCard";
import { SectionHeading } from "../../components/layout/SectionHeading";
import type { PublicPageContent } from "../../lib/public-page";
import styles from "./PricingSection.module.scss";

interface PricingSectionProps {
  actionLabel: string;
  eyebrow: string;
  plans: PublicPageContent["pricing"];
  title: string;
}

export function PricingSection({
  actionLabel,
  eyebrow,
  plans,
  title,
}: PricingSectionProps) {
  return (
    <section className={styles.section} id="pricing">
      <SectionHeading eyebrow={eyebrow} title={title} />
      <div className={styles.grid}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            actionLabel={actionLabel}
            name={plan.name}
            price={plan.price}
            features={plan.features}
          />
        ))}
      </div>
    </section>
  );
}
