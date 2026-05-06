import nodemailer from "nodemailer";

interface EmailInput {
  to: string;
  language: string;
  name: string;
  token: string;
}

const publicWebUrl = process.env.PUBLIC_WEB_URL ?? "http://localhost:3000";
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT ?? 587);
const smtpSecure = String(process.env.SMTP_SECURE ?? "false").toLowerCase() === "true";
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const smtpFrom = process.env.SMTP_FROM ?? "Scan Menu <noreply@scanmenu.local>";

export async function sendVerificationEmail(input: EmailInput) {
  const url = `${publicWebUrl}/verify-email?token=${encodeURIComponent(input.token)}`;
  await sendMail({
    to: input.to,
    subject: text(input.language, "Verify your Scan Menu email", "تأكيد بريدك في Scan Menu"),
    html: buildVerificationEmailHtml({ ...input, url })
  });
}

export function getEmailConfigStatus() {
  const missing: string[] = [];
  if (!smtpHost) missing.push("SMTP_HOST");
  if (!smtpUser) missing.push("SMTP_USER");
  if (!smtpPassword) missing.push("SMTP_PASSWORD");
  if (!smtpFrom) missing.push("SMTP_FROM");

  return {
    configured: missing.length === 0,
    missing,
    host: smtpHost ?? null,
    from: smtpFrom
  };
}

export async function sendPasswordResetEmail(input: EmailInput) {
  const url = `${publicWebUrl}/reset-password?token=${encodeURIComponent(input.token)}`;
  await sendMail({
    to: input.to,
    subject: text(input.language, "Reset your Scan Menu password", "إعادة تعيين كلمة مرور Scan Menu"),
    html: buildPasswordResetEmailHtml({ ...input, url })
  });
}

export function buildVerificationEmailHtml(input: EmailInput & { url: string }) {
  const isArabic = input.language === "ar";
  return emailLayout({
    direction: isArabic ? "rtl" : "ltr",
    title: text(input.language, "Verify your email", "تأكيد البريد الإلكتروني"),
    body: text(
      input.language,
      `Hello ${input.name}, confirm your email to activate your Scan Menu account.`,
      `مرحباً ${input.name}، أكد بريدك الإلكتروني لتفعيل حساب Scan Menu.`
    ),
    action: text(input.language, "Verify email", "تأكيد البريد"),
    url: input.url
  });
}

export function buildPasswordResetEmailHtml(input: EmailInput & { url: string }) {
  const isArabic = input.language === "ar";
  return emailLayout({
    direction: isArabic ? "rtl" : "ltr",
    title: text(input.language, "Reset your password", "إعادة تعيين كلمة المرور"),
    body: text(
      input.language,
      `Hello ${input.name}, use this secure link to set a new password. The link expires soon.`,
      `مرحباً ${input.name}، استخدم هذا الرابط الآمن لتعيين كلمة مرور جديدة. الرابط ينتهي قريباً.`
    ),
    action: text(input.language, "Reset password", "تعيين كلمة مرور جديدة"),
    url: input.url
  });
}

async function sendMail(message: { to: string; subject: string; html: string }) {
  if (!smtpHost || !smtpUser || !smtpPassword || process.env.SCANMENU_DISABLE_EMAIL === "true") {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[auth-email] ${message.subject} -> ${message.to}`);
      console.log(extractFirstUrl(message.html) ?? "[auth-email] no link found");
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPassword
    }
  });

  await transporter.sendMail({
    from: smtpFrom,
    to: message.to,
    subject: message.subject,
    html: message.html
  });
}

function emailLayout(input: { direction: "ltr" | "rtl"; title: string; body: string; action: string; url: string }) {
  return `
    <div dir="${input.direction}" style="font-family:Arial,sans-serif;line-height:1.6;color:#10231f">
      <h1>${escapeHtml(input.title)}</h1>
      <p>${escapeHtml(input.body)}</p>
      <p>
        <a href="${input.url}" style="display:inline-block;background:#163f36;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">
          ${escapeHtml(input.action)}
        </a>
      </p>
      <p style="color:#5f746d;font-size:13px">${input.url}</p>
    </div>
  `;
}

function text(language: string, en: string, ar: string) {
  return language === "ar" ? ar : en;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extractFirstUrl(html: string) {
  return html.match(/https?:\/\/[^"<\s]+/)?.[0];
}
