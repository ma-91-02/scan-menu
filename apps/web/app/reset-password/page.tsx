"use client";

import { FormEvent, useState } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="auth-flow-page"><section className="public-form">Loading...</section></main>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(token ? "Enter a new password." : "Enter your email to receive a reset link.");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (token) {
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password })
      });
      const payload = await response.json();
      setStatus(response.ok ? payload.data.message : payload.error ?? "Password reset failed");
      return;
    }

    const response = await fetch(`${apiUrl}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    await response.json().catch(() => null);
    setStatus("If this email exists, a reset link has been sent.");
  }

  return (
    <main className="auth-flow-page">
      <form className="public-form" onSubmit={submit}>
        <h1>{token ? "Reset password" : "Forgot password"}</h1>
        {token ? (
          <label>
            New password
            <input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
        ) : (
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
        )}
        <button className="public-button primary" type="submit">
          {token ? "Update password" : "Send reset link"}
        </button>
        <p className="form-status">{status}</p>
        <a className="auth-inline-link" href="/#login">Back to login</a>
      </form>
    </main>
  );
}
