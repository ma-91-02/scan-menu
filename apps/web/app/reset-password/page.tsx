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
  const copy = resetCopy[language as keyof typeof resetCopy] ?? extraResetCopy[language] ?? resetCopy.en;
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

interface ResetCopy {
  forgotTitle: string;
  resetTitle: string;
  email: string;
  newPassword: string;
  emailHint: string;
  newPasswordHint: string;
  send: string;
  update: string;
  sent: string;
  updated: string;
  failed: string;
  back: string;
}

const extraResetCopy: Record<string, ResetCopy> = Object.fromEntries([
  ["fr", ["Mot de passe oublié", "Réinitialiser le mot de passe", "Email", "Nouveau mot de passe", "Saisissez votre email pour recevoir un lien.", "Saisissez un nouveau mot de passe d'au moins 8 caractères.", "Envoyer le lien", "Mettre à jour le mot de passe", "Si cet email existe, un lien a été envoyé.", "Mot de passe mis à jour. Connectez-vous à nouveau.", "Échec de la réinitialisation.", "Retour à la connexion"]],
  ["es", ["Olvidé mi contraseña", "Restablecer contraseña", "Email", "Nueva contraseña", "Escribe tu email para recibir un enlace.", "Escribe una nueva contraseña de al menos 8 caracteres.", "Enviar enlace", "Actualizar contraseña", "Si este email existe, se envió un enlace.", "Contraseña actualizada. Inicia sesión de nuevo.", "No se pudo restablecer la contraseña.", "Volver al inicio de sesión"]],
  ["de", ["Passwort vergessen", "Passwort zurücksetzen", "E-Mail", "Neues Passwort", "Geben Sie Ihre E-Mail ein, um einen Link zu erhalten.", "Geben Sie ein neues Passwort mit mindestens 8 Zeichen ein.", "Link senden", "Passwort aktualisieren", "Falls diese E-Mail existiert, wurde ein Link gesendet.", "Passwort aktualisiert. Bitte erneut anmelden.", "Passwort zurücksetzen fehlgeschlagen.", "Zurück zur Anmeldung"]],
  ["it", ["Password dimenticata", "Reimposta password", "Email", "Nuova password", "Inserisci l'email per ricevere il link.", "Inserisci una nuova password di almeno 8 caratteri.", "Invia link", "Aggiorna password", "Se l'email esiste, il link e stato inviato.", "Password aggiornata. Accedi di nuovo.", "Reimpostazione non riuscita.", "Torna al login"]],
  ["pt", ["Esqueceu a senha", "Redefinir senha", "Email", "Nova senha", "Digite seu email para receber o link.", "Digite uma nova senha com pelo menos 8 caracteres.", "Enviar link", "Atualizar senha", "Se este email existir, o link foi enviado.", "Senha atualizada. Entre novamente.", "Falha ao redefinir senha.", "Voltar ao login"]],
  ["zh", ["忘记密码", "重置密码", "邮箱", "新密码", "输入邮箱以接收重置链接。", "输入至少 8 个字符的新密码。", "发送重置链接", "更新密码", "如果邮箱存在，重置链接已发送。", "密码已更新，请重新登录。", "重置密码失败。", "返回登录"]],
  ["ja", ["パスワードを忘れました", "パスワードをリセット", "メール", "新しいパスワード", "リセットリンクを受け取るメールを入力してください。", "8文字以上の新しいパスワードを入力してください。", "リンクを送信", "パスワード更新", "メールが存在する場合、リンクを送信しました。", "パスワードを更新しました。再ログインしてください。", "リセットに失敗しました。", "ログインへ戻る"]],
  ["ko", ["비밀번호 찾기", "비밀번호 재설정", "이메일", "새 비밀번호", "재설정 링크를 받을 이메일을 입력하세요.", "8자 이상의 새 비밀번호를 입력하세요.", "링크 보내기", "비밀번호 업데이트", "이 이메일이 있으면 링크가 전송되었습니다.", "비밀번호가 업데이트되었습니다. 다시 로그인하세요.", "비밀번호 재설정 실패.", "로그인으로 돌아가기"]],
  ["hi", ["पासवर्ड भूल गए", "पासवर्ड रीसेट करें", "ईमेल", "नया पासवर्ड", "रीसेट लिंक पाने के लिए ईमेल दर्ज करें।", "कम से कम 8 अक्षरों का नया पासवर्ड दर्ज करें।", "रीसेट लिंक भेजें", "पासवर्ड अपडेट करें", "यदि ईमेल मौजूद है, लिंक भेजा गया।", "पासवर्ड अपडेट हुआ। फिर साइन इन करें।", "पासवर्ड रीसेट विफल।", "लॉगिन पर वापस"]],
  ["ur", ["پاس ورڈ بھول گئے", "پاس ورڈ ری سیٹ", "ای میل", "نیا پاس ورڈ", "ری سیٹ لنک کے لیے ای میل درج کریں۔", "کم از کم 8 حروف کا نیا پاس ورڈ درج کریں۔", "ری سیٹ لنک بھیجیں", "پاس ورڈ اپ ڈیٹ کریں", "اگر ای میل موجود ہے تو لنک بھیج دیا گیا۔", "پاس ورڈ اپ ڈیٹ ہو گیا۔ دوبارہ لاگ ان کریں۔", "پاس ورڈ ری سیٹ ناکام۔", "لاگ ان پر واپس"]],
  ["fa", ["رمز را فراموش کرده‌اید", "بازنشانی رمز عبور", "ایمیل", "رمز جدید", "برای دریافت لینک بازنشانی ایمیل را وارد کنید.", "رمز جدید حداقل 8 کاراکتر وارد کنید.", "ارسال لینک", "به‌روزرسانی رمز", "اگر ایمیل وجود داشته باشد، لینک ارسال شد.", "رمز به‌روزرسانی شد. دوباره وارد شوید.", "بازنشانی رمز ناموفق بود.", "بازگشت به ورود"]],
  ["he", ["שכחת סיסמה", "איפוס סיסמה", "אימייל", "סיסמה חדשה", "הזן אימייל לקבלת קישור איפוס.", "הזן סיסמה חדשה לפחות 8 תווים.", "שלח קישור", "עדכן סיסמה", "אם האימייל קיים, הקישור נשלח.", "הסיסמה עודכנה. התחבר שוב.", "איפוס הסיסמה נכשל.", "חזרה להתחברות"]],
  ["id", ["Lupa kata sandi", "Atur ulang kata sandi", "Email", "Kata sandi baru", "Masukkan email untuk menerima tautan.", "Masukkan kata sandi baru minimal 8 karakter.", "Kirim tautan", "Perbarui kata sandi", "Jika email ada, tautan telah dikirim.", "Kata sandi diperbarui. Masuk lagi.", "Atur ulang gagal.", "Kembali masuk"]],
  ["ms", ["Lupa kata laluan", "Tetapkan semula kata laluan", "E-mel", "Kata laluan baharu", "Masukkan e-mel untuk menerima pautan.", "Masukkan kata laluan baharu sekurang-kurangnya 8 aksara.", "Hantar pautan", "Kemas kini kata laluan", "Jika e-mel wujud, pautan telah dihantar.", "Kata laluan dikemas kini. Log masuk semula.", "Tetapan semula gagal.", "Kembali ke log masuk"]],
  ["uk", ["Забули пароль", "Скинути пароль", "Email", "Новий пароль", "Введіть email, щоб отримати посилання.", "Введіть новий пароль щонайменше 8 символів.", "Надіслати посилання", "Оновити пароль", "Якщо email існує, посилання надіслано.", "Пароль оновлено. Увійдіть знову.", "Скидання пароля не вдалося.", "Назад до входу"]],
  ["pl", ["Nie pamiętasz hasła", "Reset hasła", "Email", "Nowe hasło", "Wpisz email, aby otrzymać link.", "Wpisz nowe hasło min. 8 znaków.", "Wyślij link", "Aktualizuj hasło", "Jeśli email istnieje, link został wysłany.", "Hasło zaktualizowane. Zaloguj się ponownie.", "Reset hasła nie powiódł się.", "Powrót do logowania"]],
  ["nl", ["Wachtwoord vergeten", "Wachtwoord resetten", "E-mail", "Nieuw wachtwoord", "Voer e-mail in voor resetlink.", "Voer nieuw wachtwoord in van minstens 8 tekens.", "Stuur link", "Wachtwoord bijwerken", "Als e-mail bestaat, is link verzonden.", "Wachtwoord bijgewerkt. Log opnieuw in.", "Reset mislukt.", "Terug naar login"]],
  ["sv", ["Glömt lösenord", "Återställ lösenord", "E-post", "Nytt lösenord", "Ange e-post för återställningslänk.", "Ange nytt lösenord med minst 8 tecken.", "Skicka länk", "Uppdatera lösenord", "Om e-post finns har länk skickats.", "Lösenord uppdaterat. Logga in igen.", "Återställning misslyckades.", "Tillbaka till inloggning"]],
  ["el", ["Ξεχάσατε κωδικό", "Επαναφορά κωδικού", "Email", "Νέος κωδικός", "Εισαγάγετε email για σύνδεσμο επαναφοράς.", "Εισαγάγετε νέο κωδικό τουλάχιστον 8 χαρακτήρων.", "Αποστολή συνδέσμου", "Ενημέρωση κωδικού", "Αν το email υπάρχει, στάλθηκε σύνδεσμος.", "Ο κωδικός ενημερώθηκε. Συνδεθείτε ξανά.", "Η επαναφορά απέτυχε.", "Πίσω στη σύνδεση"]],
  ["vi", ["Quên mật khẩu", "Đặt lại mật khẩu", "Email", "Mật khẩu mới", "Nhập email để nhận liên kết.", "Nhập mật khẩu mới ít nhất 8 ký tự.", "Gửi liên kết", "Cập nhật mật khẩu", "Nếu email tồn tại, liên kết đã được gửi.", "Mật khẩu đã cập nhật. Đăng nhập lại.", "Đặt lại thất bại.", "Quay lại đăng nhập"]],
  ["th", ["ลืมรหัสผ่าน", "รีเซ็ตรหัสผ่าน", "อีเมล", "รหัสผ่านใหม่", "กรอกอีเมลเพื่อรับลิงก์รีเซ็ต", "กรอกรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร", "ส่งลิงก์", "อัปเดตรหัสผ่าน", "หากมีอีเมลนี้ ระบบส่งลิงก์แล้ว", "อัปเดตรหัสผ่านแล้ว เข้าสู่ระบบอีกครั้ง", "รีเซ็ตรหัสผ่านไม่สำเร็จ", "กลับไปเข้าสู่ระบบ"]]
].map(([code, values]) => [code, resetFromList(values as string[])]));

function resetFromList(values: string[]): ResetCopy {
  return {
    forgotTitle: values[0] ?? "", resetTitle: values[1] ?? "", email: values[2] ?? "", newPassword: values[3] ?? "",
    emailHint: values[4] ?? "", newPasswordHint: values[5] ?? "", send: values[6] ?? "", update: values[7] ?? "",
    sent: values[8] ?? "", updated: values[9] ?? "", failed: values[10] ?? "", back: values[11] ?? ""
  };
}
