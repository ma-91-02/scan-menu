import { SessionBar } from "../session-actions";

export default function StaffDashboardPage() {
  return (
    <main className="workspace-page">
      <header className="workspace-header">
        <div>
          <h1>Staff Workspace</h1>
          <p>Role-based restaurant operations</p>
        </div>
        <a href="/">Public site</a>
      </header>

      <section className="workspace-main">
        <nav className="workspace-menu" aria-label="Staff workspace navigation">
          <span>Orders</span>
          <span>Kitchen queue</span>
          <span>Cashier</span>
          <span>Language notes</span>
        </nav>

        <div className="workspace-content">
          <SessionBar expectedArea="staff" />

          <article className="workspace-panel">
            <h2>Assigned work</h2>
            <p>
              Staff accounts land here instead of the platform admin dashboard.
              The visible modules should later be filtered by permissions such
              as kitchen, cashier, delivery, or accountant access.
            </p>
          </article>

          <section className="workspace-grid">
            <article className="workspace-card">
              Waiting
              <strong>4</strong>
            </article>
            <article className="workspace-card">
              Preparing
              <strong>2</strong>
            </article>
            <article className="workspace-card">
              Ready
              <strong>1</strong>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
