import type { RestaurantTab, TabId, TextLookup } from "../types";

interface RestaurantSidebarProps {
  activeTab: TabId;
  tabs: RestaurantTab[];
  text: TextLookup;
  onTabChange: (tab: TabId) => void;
  onLogout: () => void;
}

export function RestaurantSidebar({
  activeTab,
  tabs,
  text,
  onTabChange,
  onLogout,
}: RestaurantSidebarProps) {
  return (
    <aside className="restaurant-sidebar compact-owner-sidebar">
      <strong>{text("restaurant.brand_os")}</strong>
      {tabs.map((tab) => (
        <button
          className={activeTab === tab.id ? "active" : ""}
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
      <div className="sidebar-bottom-actions">
        <button
          className="logout-button"
          type="button"
          onClick={() => void onLogout()}
        >
          {text("restaurant.logout")}
        </button>
        <a className="logout-link" href="/">
          {text("restaurant.back_public")}
        </a>
      </div>
    </aside>
  );
}
