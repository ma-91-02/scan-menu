import { getLanguages } from "../../lib/api";

interface LegalPageProps {
  searchParams?: Promise<{ lang?: string }>;
}

export default async function PrivacyPage({ searchParams }: LegalPageProps) {
  const params = await searchParams;
  const language = params?.lang ?? "en";
  const languages = await getLanguages();
  const direction = languages.find((item) => item.code === language)?.direction ?? "ltr";
  const copy = privacyCopy(language);

  return (
    <main className="legal-page" dir={direction}>
      <a className="public-brand" href={`/?lang=${language}`}>Scan Menu</a>
      <article>
        <p>{copy.version}</p>
        <h1>{copy.title}</h1>
        {copy.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </article>
    </main>
  );
}

function privacyCopy(language: string) {
  if (language === "ar") {
    return {
      version: "الإصدار 1.0",
      title: "سياسة خصوصية Scan Menu",
      sections: [
        { title: "البيانات التي نجمعها", body: "نجمع بيانات الحساب مثل الاسم والبريد والهاتف واللغة، وبيانات المطعم والقوائم والطلبات والطاولات والصلاحيات." },
        { title: "سبب الجمع", body: "نستخدم البيانات لإنشاء الحسابات، عزل بيانات كل مطعم، تشغيل الطلبات متعددة اللغات، وإدارة الموظفين والصلاحيات." },
        { title: "الاستخدام", body: "تستخدم البيانات لتقديم الخدمة، إرسال رسائل التحقق واستعادة كلمة المرور، تحسين التجربة، وحماية الحسابات." },
        { title: "التخزين", body: "تخزن البيانات في قاعدة PostgreSQL، وتخزن كلمات المرور والتوكنات بصيغة hash آمنة وليست كنص صريح." },
        { title: "الوصول", body: "الوصول مقيد حسب الدور والمطعم. لا يرى صاحب مطعم أو موظف بيانات مطعم آخر." },
        { title: "حقوق المستخدم", body: "يمكن للمستخدم طلب تحديث بياناته أو حذف حسابه وبياناته حسب القوانين المطبقة." },
        { title: "الكوكيز والجلسات", body: "قد تستخدم المنصة جلسات أو تخزيناً محلياً ضرورياً لتسجيل الدخول وحماية الحساب." },
        { title: "الدعم", body: "يمكن التواصل مع دعم Scan Menu لأي طلبات خصوصية أو حذف بيانات." }
      ]
    };
  }

  return {
    version: "Version 1.0",
    title: "Scan Menu Privacy Policy",
    sections: [
      { title: "Data we collect", body: "We collect account data such as name, email, phone, and language, plus restaurant, menu, order, table, and permission data." },
      { title: "Why we collect it", body: "We use data to create accounts, isolate each restaurant tenant, run multilingual ordering, and manage staff permissions." },
      { title: "How we use it", body: "Data is used to provide the service, send verification and password reset emails, improve UX, and protect accounts." },
      { title: "Storage", body: "Data is stored in PostgreSQL. Passwords and security tokens are stored as secure hashes, never as raw text." },
      { title: "Access", body: "Access is restricted by role and restaurant. Owners and staff cannot view another restaurant's data." },
      { title: "User rights", body: "Users may request updates, deletion, or account data handling according to applicable laws." },
      { title: "Cookies and sessions", body: "The platform may use sessions or local storage that are necessary for authentication and account security." },
      { title: "Support", body: "Contact Scan Menu support for privacy, deletion, or data requests." }
    ]
  };
}
