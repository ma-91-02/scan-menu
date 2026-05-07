"use client";

import { PrimaryButton } from "../buttons/PrimaryButton";
import styles from "./LoginForm.module.scss";
import { useLoginForm } from "./useLoginForm";

interface LoginFormProps {
  loginLabel: string;
  preferredLanguage: string;
}

export function LoginForm({ loginLabel, preferredLanguage }: LoginFormProps) {
  const form = useLoginForm(preferredLanguage);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        form.login();
      }}
      className={styles.form}
    >
      <h2>{loginLabel}</h2>
      <label>
        {form.copy.identifier}
        <input
          name="identifier"
          autoComplete="username"
          value={form.identifier}
          onChange={(event) => form.setIdentifier(event.target.value)}
          required
        />
      </label>
      <label>
        {form.copy.password}
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(event) => form.setPassword(event.target.value)}
          required
        />
      </label>
      <PrimaryButton onClick={form.login} type="button">
        {loginLabel}
      </PrimaryButton>
      <a
        className={styles.inlineLink}
        href={`/reset-password?lang=${preferredLanguage}`}
      >
        {form.copy.forgotPassword}
      </a>
      <button
        className={styles.linkButton}
        type="button"
        onClick={() => void form.resendVerification()}
      >
        {form.copy.resendVerification}
      </button>
      <p className={styles.status}>{form.status}</p>
    </form>
  );
}
