import type { ReactNode } from "react";
import styles from "./Button.module.scss";

interface SecondaryButtonProps {
  children: ReactNode;
  href: string;
}

export function SecondaryButton({ children, href }: SecondaryButtonProps) {
  return (
    <a className={`${styles.button} ${styles.secondary}`} href={href}>
      {children}
    </a>
  );
}
