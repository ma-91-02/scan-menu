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
  const language = params.get("lang") ?? "en";
  const copy = resetCopy[language as keyof typeof resetCopy] ?? resetCopy.en;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>(token ? copy.newPasswordHint : copy.emailHint);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (token) {
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password })
      });
      const payload = await response.json();
      setStatus(response.ok ? copy.updated : payload.error ?? copy.failed);
      return;
    }

    const response = await fetch(`${apiUrl}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    await response.json().catch(() => null);
    setStatus(copy.sent);
  }

  return (
    <main className="auth-flow-page">
      <form className="public-form" onSubmit={submit}>
        <h1>{token ? copy.resetTitle : copy.forgotTitle}</h1>
        {token ? (
          <label>
            {copy.newPassword}
            <input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
        ) : (
          <label>
            {copy.email}
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
        )}
        <button className="public-button primary" type="submit">
          {token ? copy.update : copy.send}
        </button>
        <p className="form-status">{status}</p>
        <a className="auth-inline-link" href={`/?lang=${language}#login`}>{copy.back}</a>
      </form>
    </main>
  );
}

const resetCopy = {
  ar: {
    forgotTitle: "نسيت كلمة المرور",
    resetTitle: "إعادة تعيين كلمة المرور",
    email: "البريد الإلكتروني",
    newPassword: "كلمة المرور الجديدة",
    emailHint: "اكتب بريدك الإلكتروني لإرسال رابط إعادة التعيين.",
    newPasswordHint: "اكتب كلمة مرور جديدة لا تقل عن 8 أحرف.",
    send: "إرسال رابط إعادة التعيين",
    update: "تحديث كلمة المرور",
    sent: "إذا كان البريد موجوداً، فقد تم إرسال رابط إعادة التعيين.",
    updated: "تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.",
    failed: "فشلت العملية.",
    back: "العودة لتسجيل الدخول"
  },
  en: {
    forgotTitle: "Forgot password",
    resetTitle: "Reset password",
    email: "Email",
    newPassword: "New password",
    emailHint: "Enter your email to receive a reset link.",
    newPasswordHint: "Enter a new password with at least 8 characters.",
    send: "Send reset link",
    update: "Update password",
    sent: "If this email exists, a reset link has been sent.",
    updated: "Password updated. Please sign in again.",
    failed: "Password reset failed.",
    back: "Back to login"
  },
  ru: {
    forgotTitle: "Забыли пароль",
    resetTitle: "Сброс пароля",
    email: "Email",
    newPassword: "Новый пароль",
    emailHint: "Введите email, чтобы получить ссылку для сброса.",
    newPasswordHint: "Введите новый пароль не менее 8 символов.",
    send: "Отправить ссылку",
    update: "Обновить пароль",
    sent: "Если этот email существует, ссылка отправлена.",
    updated: "Пароль обновлен. Войдите снова.",
    failed: "Сброс пароля не удался.",
    back: "Вернуться ко входу"
  },
  tr: {
    forgotTitle: "Şifremi unuttum",
    resetTitle: "Şifreyi sıfırla",
    email: "E-posta",
    newPassword: "Yeni şifre",
    emailHint: "Sıfırlama bağlantısı almak için e-postanızı yazın.",
    newPasswordHint: "En az 8 karakterli yeni şifre yazın.",
    send: "Sıfırlama bağlantısı gönder",
    update: "Şifreyi güncelle",
    sent: "Bu e-posta varsa sıfırlama bağlantısı gönderildi.",
    updated: "Şifre güncellendi. Tekrar giriş yapın.",
    failed: "Şifre sıfırlama başarısız.",
    back: "Girişe dön"
  }
} as const;
