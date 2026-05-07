import styles from "./CheckboxField.module.scss";

interface CheckboxFieldProps {
  checked: boolean;
  consentLabel: string;
  language: string;
  privacyLabel: string;
  termsLabel: string;
  onChange: (checked: boolean) => void;
}

export function CheckboxField({
  checked,
  consentLabel,
  language,
  privacyLabel,
  termsLabel,
  onChange,
}: CheckboxFieldProps) {
  return (
    <label className={styles.field}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        required
      />
      {consentLabel}
      <span className={styles.links}>
        <a href={`/terms?lang=${language}`} target="_blank">
          {termsLabel}
        </a>
        <a href={`/privacy?lang=${language}`} target="_blank">
          {privacyLabel}
        </a>
      </span>
    </label>
  );
}
