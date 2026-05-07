"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-flow-page">
          <section className="public-form">Verifying email...</section>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const email = params.get("email") ?? "";
  const language = params.get("lang") ?? "en";
  const notice = params.get("notice");
  const copy = verifyCopy[language as keyof typeof verifyCopy] ?? verifyCopy.en;
  const [status, setStatus] = useState<string>(
    token ? copy.verifying : copy.required,
  );

  useEffect(() => {
    if (!token) {
      setStatus(notice === "required" ? copy.required : copy.missing);
      return;
    }

    fetch(`${apiUrl}/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const payload = await response.json();
        setStatus(response.ok ? copy.verified : (payload.error ?? copy.failed));
      })
      .catch(() => setStatus(copy.unavailable));
  }, [copy, notice, token]);

  async function resendVerification() {
    if (!email.trim()) {
      setStatus(copy.enterEmail);
      return;
    }

    setStatus(copy.sending);
    const response = await fetch(`${apiUrl}/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    setStatus(response?.ok ? copy.resent : copy.resendFailed);
  }

  return (
    <main className="auth-flow-page">
      <section className="public-form">
        <h1>{copy.title}</h1>
        <p className="form-status">{status}</p>
        {email ? (
          <button
            className="public-button primary"
            type="button"
            onClick={() => void resendVerification()}
          >
            {copy.resend}
          </button>
        ) : null}
        <a
          className="public-button secondary"
          href={`/?lang=${language}#login`}
        >
          {copy.back}
        </a>
      </section>
    </main>
  );
}

const verifyCopy = {
  ar: {
    title: "تأكيد البريد الإلكتروني",
    verifying: "جاري تأكيد البريد...",
    required:
      "يجب تأكيد بريدك الإلكتروني قبل تسجيل الدخول. افحص بريدك أو أرسل رابطاً جديداً.",
    missing: "رابط التحقق غير موجود.",
    verified: "تم تأكيد البريد. يمكنك تسجيل الدخول الآن.",
    failed: "فشل تأكيد البريد.",
    unavailable: "خدمة التحقق غير متاحة حالياً.",
    enterEmail: "البريد الإلكتروني غير متوفر لإعادة الإرسال.",
    sending: "جاري إرسال رابط جديد...",
    resent: "إذا كان البريد يحتاج تأكيداً، فقد تم إرسال رابط جديد.",
    resendFailed: "تعذر إرسال رابط التحقق.",
    resend: "إعادة إرسال رابط التحقق",
    back: "العودة لتسجيل الدخول",
  },
  en: {
    title: "Email verification",
    verifying: "Verifying email...",
    required:
      "Please verify your email before signing in. Check your inbox or send a new link.",
    missing: "Verification token is missing.",
    verified: "Email verified. You can sign in now.",
    failed: "Verification failed.",
    unavailable: "Verification service is unavailable.",
    enterEmail: "Email is missing for resend.",
    sending: "Sending a new link...",
    resent: "If this email needs verification, a new link has been sent.",
    resendFailed: "Could not send verification link.",
    resend: "Resend verification link",
    back: "Back to login",
  },
  ru: {
    title: "Подтверждение email",
    verifying: "Подтверждаем email...",
    required:
      "Подтвердите email перед входом. Проверьте почту или отправьте новую ссылку.",
    missing: "Токен подтверждения отсутствует.",
    verified: "Email подтверждён. Теперь можно войти.",
    failed: "Подтверждение не удалось.",
    unavailable: "Сервис подтверждения недоступен.",
    enterEmail: "Email отсутствует для повторной отправки.",
    sending: "Отправляем новую ссылку...",
    resent: "Если этому email нужно подтверждение, новая ссылка отправлена.",
    resendFailed: "Не удалось отправить ссылку.",
    resend: "Отправить ссылку снова",
    back: "Вернуться ко входу",
  },
} as const;
