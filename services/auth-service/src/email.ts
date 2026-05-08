import nodemailer from "nodemailer";
import { supportedLanguages } from "@babili/shared";
import type { LanguageCode } from "@babili/shared";

interface EmailInput {
  to: string;
  language: string;
  name: string;
  token: string;
}

const publicWebUrl = process.env.PUBLIC_WEB_URL ?? "http://localhost:3000";
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT ?? 587);
const smtpSecure =
  String(process.env.SMTP_SECURE ?? "false").toLowerCase() === "true";
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const configuredSmtpFrom =
  process.env.SMTP_FROM ?? "Babili <noreply@babili.local>";
const smtpFrom = normalizeSmtpFrom(configuredSmtpFrom, smtpUser);
let lastEmailError: string | null = null;

export async function sendVerificationEmail(input: EmailInput) {
  const language = normalizeEmailLanguage(input.language);
  const copy = getEmailCopy(language);
  const url = `${publicWebUrl}/verify-email?token=${encodeURIComponent(input.token)}&lang=${encodeURIComponent(language)}`;
  await sendMail({
    to: input.to,
    subject: copy.verifySubject,
    html: buildVerificationEmailHtml({ ...input, language, url }),
  });
}

export async function trySendVerificationEmail(input: EmailInput) {
  return trySend(() => sendVerificationEmail(input));
}

export async function trySendPasswordResetEmail(input: EmailInput) {
  return trySend(() => sendPasswordResetEmail(input));
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
    from: smtpFrom,
    lastError: lastEmailError,
  };
}

export async function sendPasswordResetEmail(input: EmailInput) {
  const language = normalizeEmailLanguage(input.language);
  const copy = getEmailCopy(language);
  const url = `${publicWebUrl}/reset-password?token=${encodeURIComponent(input.token)}&lang=${encodeURIComponent(language)}`;
  await sendMail({
    to: input.to,
    subject: copy.resetSubject,
    html: buildPasswordResetEmailHtml({ ...input, language, url }),
  });
}

export function buildVerificationEmailHtml(
  input: EmailInput & { url: string },
) {
  const language = normalizeEmailLanguage(input.language);
  const copy = getEmailCopy(language);
  return emailLayout({
    direction: copy.direction,
    title: copy.verifyTitle,
    body: `${copy.greeting} ${input.name}, ${copy.verifyBody}`,
    action: copy.verifyAction,
    url: input.url,
  });
}

export function buildPasswordResetEmailHtml(
  input: EmailInput & { url: string },
) {
  const language = normalizeEmailLanguage(input.language);
  const copy = getEmailCopy(language);
  return emailLayout({
    direction: copy.direction,
    title: copy.resetTitle,
    body: `${copy.greeting} ${input.name}, ${copy.resetBody}`,
    action: copy.resetAction,
    url: input.url,
  });
}

async function sendMail(message: {
  to: string;
  subject: string;
  html: string;
}) {
  if (
    !smtpHost ||
    !smtpUser ||
    !smtpPassword ||
    process.env.BABILI_DISABLE_EMAIL === "true"
  ) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[auth-email] ${message.subject} -> ${message.to}`);
      console.log(
        extractFirstUrl(message.html) ?? "[auth-email] no link found",
      );
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  await transporter.sendMail({
    from: smtpFrom,
    to: message.to,
    subject: message.subject,
    html: message.html,
  });
  lastEmailError = null;
}

function emailLayout(input: {
  direction: "ltr" | "rtl";
  title: string;
  body: string;
  action: string;
  url: string;
}) {
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type EmailCopy = {
  direction: "ltr" | "rtl";
  greeting: string;
  verifySubject: string;
  resetSubject: string;
  verifyTitle: string;
  resetTitle: string;
  verifyBody: string;
  resetBody: string;
  verifyAction: string;
  resetAction: string;
};

const rtlEmailLanguages = new Set(["ar", "ur", "fa", "he"]);

const emailCopies: Record<LanguageCode, Omit<EmailCopy, "direction">> = {
  ar: {
    greeting: "مرحباً",
    verifySubject: "تأكيد بريدك في بابلي",
    resetSubject: "إعادة تعيين كلمة مرور بابلي",
    verifyTitle: "تأكيد البريد الإلكتروني",
    resetTitle: "إعادة تعيين كلمة المرور",
    verifyBody: "أكد بريدك الإلكتروني لتفعيل حساب بابلي.",
    resetBody:
      "استخدم هذا الرابط الآمن لتعيين كلمة مرور جديدة. الرابط ينتهي قريباً.",
    verifyAction: "تأكيد البريد",
    resetAction: "تعيين كلمة مرور جديدة",
  },
  en: {
    greeting: "Hello",
    verifySubject: "Verify your Babili email",
    resetSubject: "Reset your Babili password",
    verifyTitle: "Verify your email",
    resetTitle: "Reset your password",
    verifyBody: "confirm your email to activate your Babili account.",
    resetBody:
      "use this secure link to set a new password. The link expires soon.",
    verifyAction: "Verify email",
    resetAction: "Reset password",
  },
  ru: {
    greeting: "Здравствуйте",
    verifySubject: "Подтвердите email Бабили",
    resetSubject: "Сброс пароля Бабили",
    verifyTitle: "Подтверждение email",
    resetTitle: "Сброс пароля",
    verifyBody: "подтвердите email, чтобы активировать аккаунт Бабили.",
    resetBody:
      "используйте эту безопасную ссылку, чтобы задать новый пароль. Ссылка скоро истечет.",
    verifyAction: "Подтвердить email",
    resetAction: "Сбросить пароль",
  },
  tr: {
    greeting: "Merhaba",
    verifySubject: "Babili e-postanızı doğrulayın",
    resetSubject: "Babili şifrenizi sıfırlayın",
    verifyTitle: "E-postanızı doğrulayın",
    resetTitle: "Şifrenizi sıfırlayın",
    verifyBody: "Babili hesabınızı etkinleştirmek için e-postanızı doğrulayın.",
    resetBody:
      "yeni şifre belirlemek için bu güvenli bağlantıyı kullanın. Bağlantının süresi yakında dolacak.",
    verifyAction: "E-postayı doğrula",
    resetAction: "Şifreyi sıfırla",
  },
  fr: {
    greeting: "Bonjour",
    verifySubject: "Vérifiez votre email Babili",
    resetSubject: "Réinitialiser votre mot de passe Babili",
    verifyTitle: "Vérifiez votre email",
    resetTitle: "Réinitialiser le mot de passe",
    verifyBody: "confirmez votre email pour activer votre compte Babili.",
    resetBody:
      "utilisez ce lien sécurisé pour définir un nouveau mot de passe. Le lien expire bientôt.",
    verifyAction: "Vérifier l'email",
    resetAction: "Réinitialiser le mot de passe",
  },
  es: {
    greeting: "Hola",
    verifySubject: "Verifica tu email de Babili",
    resetSubject: "Restablece tu contraseña de Babili",
    verifyTitle: "Verifica tu email",
    resetTitle: "Restablecer contraseña",
    verifyBody: "confirma tu email para activar tu cuenta de Babili.",
    resetBody:
      "usa este enlace seguro para crear una nueva contraseña. El enlace caduca pronto.",
    verifyAction: "Verificar email",
    resetAction: "Restablecer contraseña",
  },
  de: {
    greeting: "Hallo",
    verifySubject: "Bestätigen Sie Ihre Babili E-Mail",
    resetSubject: "Babili Passwort zurücksetzen",
    verifyTitle: "E-Mail bestätigen",
    resetTitle: "Passwort zurücksetzen",
    verifyBody:
      "bestätigen Sie Ihre E-Mail, um Ihr Babili Konto zu aktivieren.",
    resetBody:
      "verwenden Sie diesen sicheren Link, um ein neues Passwort festzulegen. Der Link läuft bald ab.",
    verifyAction: "E-Mail bestätigen",
    resetAction: "Passwort zurücksetzen",
  },
  it: {
    greeting: "Ciao",
    verifySubject: "Verifica la tua email Babili",
    resetSubject: "Reimposta la password Babili",
    verifyTitle: "Verifica la tua email",
    resetTitle: "Reimposta la password",
    verifyBody: "conferma la tua email per attivare il tuo account Babili.",
    resetBody:
      "usa questo link sicuro per impostare una nuova password. Il link scade a breve.",
    verifyAction: "Verifica email",
    resetAction: "Reimposta password",
  },
  pt: {
    greeting: "Olá",
    verifySubject: "Verifique seu email do Babili",
    resetSubject: "Redefina sua senha do Babili",
    verifyTitle: "Verifique seu email",
    resetTitle: "Redefinir senha",
    verifyBody: "confirme seu email para ativar sua conta Babili.",
    resetBody:
      "use este link seguro para criar uma nova senha. O link expira em breve.",
    verifyAction: "Verificar email",
    resetAction: "Redefinir senha",
  },
  zh: {
    greeting: "您好",
    verifySubject: "验证您的 Babili 邮箱",
    resetSubject: "重置您的 Babili 密码",
    verifyTitle: "验证邮箱",
    resetTitle: "重置密码",
    verifyBody: "请确认您的邮箱以激活 Babili 账户。",
    resetBody: "请使用此安全链接设置新密码。链接即将过期。",
    verifyAction: "验证邮箱",
    resetAction: "重置密码",
  },
  ja: {
    greeting: "こんにちは",
    verifySubject: "Babili のメールを確認してください",
    resetSubject: "Babili のパスワードをリセット",
    verifyTitle: "メール確認",
    resetTitle: "パスワードをリセット",
    verifyBody: "Babili アカウントを有効にするためメールを確認してください。",
    resetBody:
      "この安全なリンクで新しいパスワードを設定してください。リンクはまもなく期限切れになります。",
    verifyAction: "メールを確認",
    resetAction: "パスワードをリセット",
  },
  ko: {
    greeting: "안녕하세요",
    verifySubject: "Babili 이메일 인증",
    resetSubject: "Babili 비밀번호 재설정",
    verifyTitle: "이메일 인증",
    resetTitle: "비밀번호 재설정",
    verifyBody: "Babili 계정을 활성화하려면 이메일을 인증하세요.",
    resetBody:
      "이 안전한 링크로 새 비밀번호를 설정하세요. 링크는 곧 만료됩니다.",
    verifyAction: "이메일 인증",
    resetAction: "비밀번호 재설정",
  },
  hi: {
    greeting: "नमस्ते",
    verifySubject: "अपना Babili ईमेल सत्यापित करें",
    resetSubject: "अपना Babili पासवर्ड रीसेट करें",
    verifyTitle: "ईमेल सत्यापित करें",
    resetTitle: "पासवर्ड रीसेट करें",
    verifyBody: "अपना Babili खाता सक्रिय करने के लिए ईमेल सत्यापित करें।",
    resetBody:
      "नया पासवर्ड सेट करने के लिए इस सुरक्षित लिंक का उपयोग करें। लिंक जल्द समाप्त होगा।",
    verifyAction: "ईमेल सत्यापित करें",
    resetAction: "पासवर्ड रीसेट करें",
  },
  ur: {
    greeting: "سلام",
    verifySubject: "اپنا Babili ای میل تصدیق کریں",
    resetSubject: "اپنا Babili پاس ورڈ ری سیٹ کریں",
    verifyTitle: "ای میل کی تصدیق",
    resetTitle: "پاس ورڈ ری سیٹ",
    verifyBody: "اپنا Babili اکاؤنٹ فعال کرنے کے لیے ای میل کی تصدیق کریں۔",
    resetBody:
      "نیا پاس ورڈ بنانے کے لیے یہ محفوظ لنک استعمال کریں۔ لنک جلد ختم ہو جائے گا۔",
    verifyAction: "ای میل تصدیق کریں",
    resetAction: "پاس ورڈ ری سیٹ کریں",
  },
  fa: {
    greeting: "سلام",
    verifySubject: "ایمیل Babili خود را تأیید کنید",
    resetSubject: "رمز عبور Babili را بازنشانی کنید",
    verifyTitle: "تأیید ایمیل",
    resetTitle: "بازنشانی رمز عبور",
    verifyBody: "برای فعال‌سازی حساب بابلي ایمیل خود را تأیید کنید.",
    resetBody:
      "برای تعیین رمز عبور جدید از این لینک امن استفاده کنید. لینک به‌زودی منقضی می‌شود.",
    verifyAction: "تأیید ایمیل",
    resetAction: "بازنشانی رمز عبور",
  },
  he: {
    greeting: "שלום",
    verifySubject: "אמת את האימייל שלך ב-Babili",
    resetSubject: "איפוס סיסמת Babili",
    verifyTitle: "אימות אימייל",
    resetTitle: "איפוס סיסמה",
    verifyBody: "אשר את האימייל כדי להפעיל את חשבון Babili שלך.",
    resetBody: "השתמש בקישור המאובטח כדי להגדיר סיסמה חדשה. הקישור יפוג בקרוב.",
    verifyAction: "אמת אימייל",
    resetAction: "אפס סיסמה",
  },
  id: {
    greeting: "Halo",
    verifySubject: "Verifikasi email Babili Anda",
    resetSubject: "Atur ulang kata sandi Babili",
    verifyTitle: "Verifikasi email",
    resetTitle: "Atur ulang kata sandi",
    verifyBody: "konfirmasi email Anda untuk mengaktifkan akun Babili.",
    resetBody:
      "gunakan tautan aman ini untuk membuat kata sandi baru. Tautan segera kedaluwarsa.",
    verifyAction: "Verifikasi email",
    resetAction: "Atur ulang kata sandi",
  },
  ms: {
    greeting: "Helo",
    verifySubject: "Sahkan e-mel Babili anda",
    resetSubject: "Tetapkan semula kata laluan Babili",
    verifyTitle: "Sahkan e-mel",
    resetTitle: "Tetapkan semula kata laluan",
    verifyBody: "sahkan e-mel untuk mengaktifkan akaun Babili anda.",
    resetBody:
      "gunakan pautan selamat ini untuk menetapkan kata laluan baharu. Pautan akan tamat tempoh tidak lama lagi.",
    verifyAction: "Sahkan e-mel",
    resetAction: "Tetapkan semula kata laluan",
  },
  uk: {
    greeting: "Вітаємо",
    verifySubject: "Підтвердьте email Babili",
    resetSubject: "Скидання пароля Babili",
    verifyTitle: "Підтвердження email",
    resetTitle: "Скидання пароля",
    verifyBody: "підтвердьте email, щоб активувати обліковий запис Babili.",
    resetBody:
      "скористайтеся цим безпечним посиланням, щоб створити новий пароль. Посилання скоро закінчиться.",
    verifyAction: "Підтвердити email",
    resetAction: "Скинути пароль",
  },
  pl: {
    greeting: "Cześć",
    verifySubject: "Potwierdź email Babili",
    resetSubject: "Zresetuj hasło Babili",
    verifyTitle: "Potwierdź email",
    resetTitle: "Reset hasła",
    verifyBody: "potwierdź email, aby aktywować konto Babili.",
    resetBody:
      "użyj tego bezpiecznego linku, aby ustawić nowe hasło. Link wkrótce wygaśnie.",
    verifyAction: "Potwierdź email",
    resetAction: "Zresetuj hasło",
  },
  nl: {
    greeting: "Hallo",
    verifySubject: "Verifieer je Babili e-mail",
    resetSubject: "Reset je Babili wachtwoord",
    verifyTitle: "E-mail verifiëren",
    resetTitle: "Wachtwoord resetten",
    verifyBody: "bevestig je e-mail om je Babili account te activeren.",
    resetBody:
      "gebruik deze veilige link om een nieuw wachtwoord in te stellen. De link verloopt binnenkort.",
    verifyAction: "E-mail verifiëren",
    resetAction: "Wachtwoord resetten",
  },
  sv: {
    greeting: "Hej",
    verifySubject: "Verifiera din Babili e-post",
    resetSubject: "Återställ ditt Babili lösenord",
    verifyTitle: "Verifiera e-post",
    resetTitle: "Återställ lösenord",
    verifyBody: "bekräfta din e-post för att aktivera ditt Babili-konto.",
    resetBody:
      "använd denna säkra länk för att ange ett nytt lösenord. Länken går snart ut.",
    verifyAction: "Verifiera e-post",
    resetAction: "Återställ lösenord",
  },
  el: {
    greeting: "Γεια σας",
    verifySubject: "Επαληθεύστε το email σας στο Babili",
    resetSubject: "Επαναφορά κωδικού Babili",
    verifyTitle: "Επαλήθευση email",
    resetTitle: "Επαναφορά κωδικού",
    verifyBody:
      "επιβεβαιώστε το email σας για να ενεργοποιήσετε τον λογαριασμό Babili.",
    resetBody:
      "χρησιμοποιήστε αυτόν τον ασφαλή σύνδεσμο για νέο κωδικό. Ο σύνδεσμος λήγει σύντομα.",
    verifyAction: "Επαλήθευση email",
    resetAction: "Επαναφορά κωδικού",
  },
  vi: {
    greeting: "Xin chào",
    verifySubject: "Xác minh email Babili của bạn",
    resetSubject: "Đặt lại mật khẩu Babili",
    verifyTitle: "Xác minh email",
    resetTitle: "Đặt lại mật khẩu",
    verifyBody: "xác nhận email để kích hoạt tài khoản Babili.",
    resetBody:
      "dùng liên kết an toàn này để đặt mật khẩu mới. Liên kết sẽ sớm hết hạn.",
    verifyAction: "Xác minh email",
    resetAction: "Đặt lại mật khẩu",
  },
  th: {
    greeting: "สวัสดี",
    verifySubject: "ยืนยันอีเมล Babili ของคุณ",
    resetSubject: "รีเซ็ตรหัสผ่าน Babili",
    verifyTitle: "ยืนยันอีเมล",
    resetTitle: "รีเซ็ตรหัสผ่าน",
    verifyBody: "ยืนยันอีเมลเพื่อเปิดใช้งานบัญชี Babili ของคุณ",
    resetBody:
      "ใช้ลิงก์ปลอดภัยนี้เพื่อตั้งรหัสผ่านใหม่ ลิงก์จะหมดอายุเร็ว ๆ นี้",
    verifyAction: "ยืนยันอีเมล",
    resetAction: "รีเซ็ตรหัสผ่าน",
  },
};

export function getEmailCopy(language: string): EmailCopy {
  const code = normalizeEmailLanguage(language);
  return {
    direction: rtlEmailLanguages.has(code) ? "rtl" : "ltr",
    ...emailCopies[code],
  };
}

export function getEmailCopyCoverage() {
  const copyLanguages = Object.keys(emailCopies);
  return supportedLanguages.map((language) => ({
    code: language.code,
    ok: copyLanguages.includes(String(language.code)),
  }));
}

function normalizeEmailLanguage(language: string): LanguageCode {
  return supportedLanguages.some((item) => item.code === language)
    ? (language as LanguageCode)
    : "en";
}

function extractFirstUrl(html: string) {
  return html.match(/https?:\/\/[^"<\s]+/)?.[0];
}

function normalizeSmtpFrom(value: string, user?: string) {
  if (user && value.includes("your-domain.com")) {
    return `Babili <${user}>`;
  }
  return value;
}

async function trySend(send: () => Promise<void>) {
  try {
    await send();
    return { delivered: true, error: null };
  } catch (error) {
    lastEmailError =
      error instanceof Error ? error.message : "Unknown email delivery error";
    console.error("Auth email delivery failed", lastEmailError);
    return { delivered: false, error: lastEmailError };
  }
}
