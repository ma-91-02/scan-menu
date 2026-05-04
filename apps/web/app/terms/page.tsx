import { getLanguages } from "../../lib/api";

interface LegalPageProps {
  searchParams?: Promise<{ lang?: string }>;
}

export default async function TermsPage({ searchParams }: LegalPageProps) {
  const params = await searchParams;
  const language = params?.lang ?? "en";
  const languages = await getLanguages();
  const direction = languages.find((item) => item.code === language)?.direction ?? "ltr";
  const copy = legalCopy(language);

  return (
    <main className="legal-page" dir={direction}>
      <a className="public-brand" href={`/?lang=${language}`}>Scan Menu</a>
      <article>
        <p>{copy.version}</p>
        <h1>{copy.termsTitle}</h1>
        {copy.termsSections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </article>
    </main>
  );
}

function legalCopy(language: string) {
  if (language === "ar") {
    return {
      version: "الإصدار 1.0",
      termsTitle: "شروط استخدام Scan Menu",
      termsSections: [
        { title: "طبيعة الخدمة", body: "Scan Menu منصة SaaS لتمكين المطاعم من إدارة قوائم متعددة اللغات واستقبال الطلبات بلغة يفهمها فريق المطعم." },
        { title: "مسؤولية صاحب المطعم", body: "صاحب المطعم مسؤول عن دقة بيانات مطعمه وقائمته وأسعاره ومكوناته وصوره وأي معلومات يعرضها للزبائن." },
        { title: "الحسابات والصلاحيات", body: "يجب استخدام الحسابات حسب الصلاحيات المخصصة. صاحب المطعم مسؤول عن إنشاء موظفيه وإدارة أدوارهم." },
        { title: "سلوك المستخدم", body: "يجب عدم استخدام المنصة لأي نشاط غير قانوني أو مسيء أو يؤدي إلى تعطيل الخدمة أو انتهاك بيانات الآخرين." },
        { title: "إيقاف الحساب", body: "قد يتم تقييد أو إيقاف الحسابات التي تخالف هذه الشروط أو تهدد أمن المنصة أو بيانات العملاء." },
        { title: "الاشتراكات", body: "خطط الاشتراك قابلة للتطوير لاحقاً. أي دفع فعلي سيخضع لشروط واضحة قبل تفعيله." },
        { title: "حدود المسؤولية", body: "تقدم الخدمة كما هي ضمن الحدود القانونية، ولا تتحمل Scan Menu مسؤولية أخطاء بيانات المطعم التي يدخلها صاحب الحساب." }
      ]
    };
  }

  return {
    version: "Version 1.0",
    termsTitle: "Scan Menu Terms of Use",
    termsSections: [
      { title: "Service", body: "Scan Menu is a SaaS platform for restaurants to manage multilingual menus and receive orders in the language used by their team." },
      { title: "Restaurant responsibility", body: "Restaurant owners are responsible for the accuracy of restaurant data, menu items, prices, ingredients, images, and public information." },
      { title: "Accounts and permissions", body: "Accounts must be used according to assigned permissions. Restaurant owners manage their staff accounts and roles." },
      { title: "User conduct", body: "The platform may not be used for illegal, abusive, disruptive, or privacy-invasive activity." },
      { title: "Account suspension", body: "Accounts may be restricted or suspended when these terms are violated or platform security is threatened." },
      { title: "Subscriptions", body: "Subscription plans may be expanded later. Real payments will be governed by clear terms before activation." },
      { title: "Liability", body: "The service is provided within legal limits, and Scan Menu is not responsible for incorrect restaurant content entered by account owners." }
    ]
  };
}
