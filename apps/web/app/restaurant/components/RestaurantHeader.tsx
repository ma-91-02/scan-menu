import type { RestaurantProfile, TextLookup } from "../types";

interface RestaurantHeaderProps {
  activeLabel?: string;
  kitchenCount: number;
  profile: RestaurantProfile;
  text: TextLookup;
  waiterRequestCount: number;
}

export function RestaurantHeader({
  activeLabel,
  kitchenCount,
  profile,
  text,
  waiterRequestCount,
}: RestaurantHeaderProps) {
  return (
    <header className="owner-topbar">
      <div>
        <p>{text("restaurant.dashboard")}</p>
        <h1>{activeLabel}</h1>
        <span>{profile.name}</span>
      </div>
      <div className="owner-stats">
        <span>
          {text("restaurant.kitchen")} <strong>{kitchenCount}</strong>
        </span>
        <span>
          {text("restaurant.waiter_requests")}{" "}
          <strong>{waiterRequestCount}</strong>
        </span>
      </div>
    </header>
  );
}
