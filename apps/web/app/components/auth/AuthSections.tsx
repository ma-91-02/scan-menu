import type { ReactNode } from "react";
import styles from "./AuthSections.module.scss";

interface AuthSectionProps {
  children: ReactNode;
}

export function LoginSection({ children }: AuthSectionProps) {
  return (
    <section className={styles.loginSection} id="login">
      <div className={styles.loginShell}>{children}</div>
    </section>
  );
}

export function RegistrationSection({ children }: AuthSectionProps) {
  return (
    <section className={styles.registrationSection} id="registration">
      {children}
    </section>
  );
}
