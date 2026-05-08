import { SessionBar } from "../session-actions";

const partnerCards = [
  ["طلبات التوصيل", "متابعة الرحلات النشطة وتحديث حالة التسليم."],
  ["طلبات التوريد", "عرض طلبات المطاعم للمواد الطازجة والمخزون."],
  ["الكتالوج", "إدارة المنتجات والأسعار والكميات المتاحة."],
  ["الفواتير", "متابعة المستحقات والمدفوعات بين الشركاء والمطاعم."],
];

export default function PartnersPage() {
  return (
    <main className="workspace-page">
      <header className="workspace-header">
        <div>
          <h1>Partner Workspace</h1>
          <p>Delivery, farm, and supplier operations</p>
        </div>
        <a href="/">Public site</a>
      </header>

      <section className="workspace-main">
        <nav className="workspace-menu" aria-label="Partner navigation">
          <span>Delivery tasks</span>
          <span>Supply requests</span>
          <span>Product catalog</span>
          <span>Invoices</span>
        </nav>

        <div className="workspace-content">
          <SessionBar expectedArea="partners" />
          <article className="workspace-panel">
            <h2>Partner operations</h2>
            <p>
              This workspace is for delivery drivers, farmers, grocery owners,
              and suppliers who support restaurants through Babili.
            </p>
          </article>

          <section className="workspace-grid">
            {partnerCards.map(([title, body]) => (
              <article className="workspace-card" key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}
