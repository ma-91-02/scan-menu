import styles from "./VerificationMessage.module.scss";

interface VerificationMessageProps {
  children: string;
}

export function VerificationMessage({ children }: VerificationMessageProps) {
  return <p className={styles.message}>{children}</p>;
}
