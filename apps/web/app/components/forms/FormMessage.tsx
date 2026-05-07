import styles from "./FormMessage.module.scss";

interface FormMessageProps {
  children: string;
}

export function FormMessage({ children }: FormMessageProps) {
  return <p className={styles.message}>{children}</p>;
}
