"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="auth-flow-page"><section className="public-form">Verifying email...</section></main>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState("Verifying email...");

  useEffect(() => {
    if (!token) {
      setStatus("Verification token is missing.");
      return;
    }

    fetch(`${apiUrl}/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const payload = await response.json();
        setStatus(response.ok ? payload.data.message : payload.error ?? "Verification failed");
      })
      .catch(() => setStatus("Verification service is unavailable."));
  }, [token]);

  return (
    <main className="auth-flow-page">
      <section className="public-form">
        <h1>Email verification</h1>
        <p className="form-status">{status}</p>
        <a className="public-button primary" href="/#login">Back to login</a>
      </section>
    </main>
  );
}
