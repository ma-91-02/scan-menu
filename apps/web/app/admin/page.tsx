import { getDashboardData, getRawPublicPage, languageLabel } from "../../lib/api";
import { SessionBar } from "../session-actions";
import { PublicContentManager } from "./public-content-manager";

export default async function AdminDashboardPage() {
  const [{ apiUrl, languages, menu, orders }, publicPage] = await Promise.all([
    getDashboardData(),
    getRawPublicPage()
  ]);
  const activeOrders = orders.filter((order) => !["completed", "cancelled"].includes(order.status));
  const metrics = [
    { label: "المطاعم النشطة", value: "1", detail: "جاهزة لاستقبال الطلبات" },
    { label: "طلبات اليوم", value: orders.length.toString(), detail: `${activeOrders.length} طلب نشط` },
    { label: "أصناف القائمة", value: menu.length.toString(), detail: "متعددة اللغات" },
    { label: "اللغات", value: languages.length.toString(), detail: "تحكم مركزي" }
  ];

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>Menuza</strong>
          <span>لوحة تحكم المنصة</span>
        </div>

        <nav className="nav" aria-label="Dashboard navigation">
          <a className="nav-item active" href="/admin">
            لوحة التشغيل
          </a>
          <a className="nav-item" href="/">
            الواجهة العامة
          </a>
          <a className="nav-item" href="#public-content">
            محتوى الصفحة العامة
          </a>
          <a className="nav-item" href="#languages">
            اللغات والترجمة
          </a>
          <a className="nav-item" href="#">
            المحاسبة
          </a>
        </nav>
      </aside>

      <section className="main">
        <header className="topbar">
          <div>
            <h1>لوحة تحكم Menuza</h1>
            <p className="muted">إدارة المطاعم، الطلبات، المستخدمين، ومحتوى الواجهة العامة.</p>
            <p className="muted">API: {apiUrl}</p>
          </div>
          <a className="button" href="/">
            عرض الواجهة العامة
          </a>
        </header>

        <SessionBar expectedArea="admin" />

        <section className="grid metrics" aria-label="Platform metrics">
          {metrics.map((metric) => (
            <article className="card metric" key={metric.label}>
              <span className="muted">{metric.label}</span>
              <strong>{metric.value}</strong>
              <small className="muted">{metric.detail}</small>
            </article>
          ))}
        </section>

        <section className="grid content-grid">
          <article className="card">
            <h2>الطلبات الحية</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>الطلب</th>
                  <th>العميل</th>
                  <th>مسار اللغة</th>
                  <th>ملاحظة</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customerId}</td>
                    <td>
                      {languageLabel(order.customerLanguage)} {"->"} {languageLabel(order.restaurantLanguage)}
                    </td>
                    <td>
                      {order.lines
                        .map((line) => `${line.customerNote ?? "-"} -> ${line.restaurantNote ?? "-"}`)
                        .join(", ")}
                    </td>
                    <td>
                      <span className="status">{statusLabel(order.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <aside className="grid" id="languages">
            <article className="card">
              <h2>اللغات المدعومة</h2>
              {languages.map((language) => (
                <div className="language-row" key={language.code}>
                  <div>
                    <strong>{language.nativeName}</strong>
                    <p className="muted">{language.code}</p>
                  </div>
                  <span className="status">{language.direction}</span>
                </div>
              ))}
            </article>

            <article className="card">
              <h2>قائمة Bistro Aurora</h2>
              {menu.map((item) => (
                <div className="language-row" key={item.id}>
                  <div>
                    <strong>{item.displayName}</strong>
                    <p className="muted">{item.displayDescription}</p>
                  </div>
                  <span className="status">
                    {item.price} {item.currency}
                  </span>
                </div>
              ))}
            </article>
          </aside>
        </section>

        <section id="public-content" className="admin-section">
          <PublicContentManager initialContent={publicPage} />
        </section>
      </section>
    </main>
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    placed: "تم الإرسال",
    accepted: "مقبول",
    preparing: "قيد التحضير",
    ready: "جاهز",
    completed: "مكتمل",
    cancelled: "ملغي"
  };

  return labels[status] ?? status;
}
