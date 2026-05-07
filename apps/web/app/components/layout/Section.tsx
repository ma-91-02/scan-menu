import type { ReactNode } from "react";
import styles from "./Section.module.scss";

interface SectionProps {
  children: ReactNode;
  id?: string;
}

export function Section({ children, id }: SectionProps) {
  return (
    <section className={styles.section} id={id}>
      {children}
    </section>
  );
}
