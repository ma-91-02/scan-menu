import type { InputHTMLAttributes } from "react";
import styles from "./TextField.module.scss";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function TextField({ label, ...inputProps }: TextFieldProps) {
  return (
    <label className={styles.field}>
      {label}
      <input {...inputProps} />
    </label>
  );
}
