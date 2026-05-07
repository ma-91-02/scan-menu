import { PrimaryButton } from "../buttons/PrimaryButton";
import styles from "./PlanCard.module.scss";

interface PlanCardProps {
  actionLabel: string;
  features: string[];
  name: string;
  price: string;
}

export function PlanCard({
  actionLabel,
  features,
  name,
  price,
}: PlanCardProps) {
  return (
    <article className={styles.card}>
      <h3>{name}</h3>
      <strong>{price}</strong>
      <ul>
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <PrimaryButton href="#registration">{actionLabel}</PrimaryButton>
    </article>
  );
}
