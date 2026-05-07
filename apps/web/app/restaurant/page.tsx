"use client";

import { RestaurantSidebar } from "./components/RestaurantSidebar";
import { RestaurantWorkspace } from "./components/RestaurantWorkspace";
import { useRestaurantDashboard } from "./hooks/useRestaurantDashboard";

export default function RestaurantDashboardPage() {
  const dashboard = useRestaurantDashboard();

  return (
    <main className="restaurant-console" dir={dashboard.direction}>
      <RestaurantSidebar
        activeTab={dashboard.activeTab}
        tabs={dashboard.tabs}
        text={dashboard.text}
        onLogout={() => void dashboard.logout()}
        onTabChange={dashboard.setActiveTab}
      />
      <RestaurantWorkspace dashboard={dashboard} />
    </main>
  );
}
