"use client";

import { useState } from "react";
import { PrimaryButton } from "../buttons/PrimaryButton";
import { getLoginCopy } from "../../lib/auth-copy";
import styles from "./LoginForm.module.scss";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const sessionStorageKey = "scanmenu-session";

interface LoginFormProps {
  loginLabel: string;
  preferredLanguage: string;
}

export function LoginForm({ loginLabel, preferredLanguage }: LoginFormProps) {
  const [status, setStatus] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const copy = getLoginCopy(preferredLanguage);

  async function login() {
    setStatus(copy.signingIn);

    const response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier,
        password,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      if (
        response.status === 403 &&
        payload.code === "EMAIL_VERIFICATION_REQUIRED"
      ) {
        const params = new URLSearchParams({
          lang: preferredLanguage,
          notice: "required",
          email: identifier,
        });
        window.location.href = `/verify-email?${params.toString()}`;
        return;
      }

      setStatus(
        response.status === 401 ? copy.failed : (payload.error ?? copy.failed),
      );
      return;
    }

    setStatus(copy.welcome);
    localStorage.setItem(sessionStorageKey, payload.data.session.id);
    window.location.href = payload.data.redirectTo;
  }

  async function resendVerification() {
    if (!identifier.trim()) {
      setStatus(copy.enterEmail);
      return;
    }

    setStatus(copy.sendingVerification);
    const response = await fetch(`${apiUrl}/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: identifier }),
    });
    await response.json().catch(() => null);
    setStatus(response.ok ? copy.resent : copy.resendFailed);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        login();
      }}
      className={styles.form}
    >
      <h2>{loginLabel}</h2>
      <label>
        {copy.identifier}
        <input
          name="identifier"
          autoComplete="username"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
        />
      </label>
      <label>
        {copy.password}
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      <PrimaryButton onClick={login} type="button">
        {loginLabel}
      </PrimaryButton>
      <a
        className={styles.inlineLink}
        href={`/reset-password?lang=${preferredLanguage}`}
      >
        {copy.forgotPassword}
      </a>
      <button
        className={styles.linkButton}
        type="button"
        onClick={() => void resendVerification()}
      >
        {copy.resendVerification}
      </button>
      <p className={styles.status}>{status}</p>
    </form>
  );
}
