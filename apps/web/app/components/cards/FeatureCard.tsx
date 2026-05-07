import styles from "./FeatureCard.module.scss";

interface FeatureCardProps {
  description: string;
  imageUrl: string;
  title: string;
}

export function FeatureCard({
  description,
  imageUrl,
  title,
}: FeatureCardProps) {
  return (
    <article className={styles.card}>
      <div
        className={styles.image}
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className={styles.body}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}
