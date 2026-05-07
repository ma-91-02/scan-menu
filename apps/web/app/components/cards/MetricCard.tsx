import type { ReactNode } from "react";
import styles from "./MetricCard.module.scss";

interface MetricCardProps {
  children: ReactNode;
}

export function MetricCard({ children }: MetricCardProps) {
  return <article className={styles.card}>{children}</article>;
}
