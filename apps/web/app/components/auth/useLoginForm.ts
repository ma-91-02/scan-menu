"use client";

import { useState } from "react";
import { loginRequest, resendVerificationRequest } from "../../lib/auth-api";
import { getLoginCopy } from "../../lib/auth-copy";

const sessionStorageKey = "scanmenu-session";

export function useLoginForm(preferredLanguage: string) {
  const [status, setStatus] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const copy = getLoginCopy(preferredLanguage);

  async function login() {
    setStatus(copy.signingIn);

    const { response, payload } = await loginRequest({
      identifier,
      password,
    });

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
    const { response } = await resendVerificationRequest(identifier);
    setStatus(response.ok ? copy.resent : copy.resendFailed);
  }

  return {
    copy,
    identifier,
    login,
    password,
    resendVerification,
    setIdentifier,
    setPassword,
    status,
  };
}
