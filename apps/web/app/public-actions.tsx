"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

interface LanguageOption {
  code: string;
  nativeName: string;
  flag: string;
}

interface LanguageSelectProps {
  currentLanguage: string;
  languages: LanguageOption[];
}

interface LanguageBootstrapProps {
  fallbackLanguage: string;
  languages: LanguageOption[];
}

interface LoginFormProps {
  loginLabel: string;
}

interface RegistrationFormProps {
  registrationLabel: string;
  preferredLanguage: string;
  restaurantLabel: string;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const languageStorageKey = "scanmenu-language";
const sessionStorageKey = "scanmenu-session";

export function LanguageBootstrap({ fallbackLanguage, languages }: LanguageBootstrapProps) {
  const router = useRouter();
  const languageCodes = useMemo(() => languages.map((language) => language.code), [languages]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlLanguage = searchParams.get("lang");

    if (urlLanguage) {
      localStorage.setItem(languageStorageKey, urlLanguage);
      return;
    }

    const storedLanguage = localStorage.getItem(languageStorageKey);
    const browserLanguage = navigator.language?.split("-")[0];
    const nextLanguage =
      (storedLanguage && languageCodes.includes(storedLanguage) && storedLanguage) ||
      (browserLanguage && languageCodes.includes(browserLanguage) && browserLanguage) ||
      fallbackLanguage;

    localStorage.setItem(languageStorageKey, nextLanguage);
    router.replace(`${window.location.pathname}?lang=${nextLanguage}`);
  }, [fallbackLanguage, languageCodes, router]);

  return null;
}

export function LanguageSelect({ currentLanguage, languages }: LanguageSelectProps) {
  const router = useRouter();

  return (
    <label className="language-select">
      <span aria-hidden="true">🌐</span>
      <select
        aria-label="Choose language"
        value={currentLanguage}
        onChange={(event) => {
          localStorage.setItem(languageStorageKey, event.target.value);
          router.push(`/?lang=${event.target.value}`);
        }}
      >
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.flag} {language.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}

export function LoginForm({ loginLabel }: LoginFormProps) {
  const [status, setStatus] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    setStatus("Signing in...");

    const response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier,
        password
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error ?? "Login failed");
      return;
    }

    setStatus(`Welcome ${payload.data.user.name}. Redirecting...`);
    localStorage.setItem(sessionStorageKey, payload.data.session.id);
    window.location.href = payload.data.redirectTo;
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        login();
      }}
      className="public-form"
    >
      <h2>{loginLabel}</h2>
      <label>
        Email, username, or phone
        <input
          name="identifier"
          autoComplete="username"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      <button className="public-button primary" type="button" onClick={login}>
        {loginLabel}
      </button>
      <a className="auth-inline-link" href="/reset-password">
        Forgot password?
      </a>
      <p className="form-status">{status}</p>
    </form>
  );
}

export function RegistrationForm({
  registrationLabel,
  preferredLanguage,
  restaurantLabel
}: RegistrationFormProps) {
  const [status, setStatus] = useState("");
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Creating account...");
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setStatus("Passwords do not match");
      return;
    }

    const response = await fetch(`${apiUrl}/auth/register/restaurant-owner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${String(formData.get("firstName") ?? "").trim()} ${String(formData.get("lastName") ?? "").trim()}`.trim(),
        restaurantName: formData.get("restaurantName"),
        username: formData.get("username"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        password,
        preferredLanguage,
        acceptedTerms: acceptedPolicies,
        acceptedPrivacy: acceptedPolicies
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error ?? "Registration failed");
      return;
    }

    setStatus("Account created. Please check your email to verify the account before signing in.");
  }

  return (
    <form onSubmit={submitRegistration} className="registration-form">
      <div className="registration-heading">
        <h2>{registrationLabel}</h2>
        <button className="public-button primary" data-testid="registration-submit-top" type="submit">
          {restaurantLabel}
        </button>
      </div>
      <div className="registration-grid">
        <label>
          First name
          <input name="firstName" autoComplete="given-name" required />
        </label>
        <label>
          Last name
          <input name="lastName" autoComplete="family-name" />
        </label>
        <label>
          Restaurant name
          <input name="restaurantName" required />
        </label>
        <label>
          Username
          <input name="username" autoComplete="username" required />
        </label>
        <label>
          Phone number
          <input name="phone" autoComplete="tel" required />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="new-password" required />
        </label>
        <label>
          Confirm password
          <input name="confirmPassword" type="password" autoComplete="new-password" required />
        </label>
      </div>
      <label className="registration-consent-row">
        <input
          type="checkbox"
          checked={acceptedPolicies}
          onChange={(event) => setAcceptedPolicies(event.target.checked)}
          required
        />
        I agree to the Terms of Use and Privacy Policy
        <span className="consent-links">
          <a href={`/terms?lang=${preferredLanguage}`} target="_blank">Terms</a>
          <a href={`/privacy?lang=${preferredLanguage}`} target="_blank">Privacy</a>
        </span>
      </label>
      <button className="public-button primary wide" type="submit">
        {restaurantLabel}
      </button>
      <p className="form-status">{status}</p>
    </form>
  );
}
