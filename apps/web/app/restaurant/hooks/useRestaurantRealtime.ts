import { useEffect } from "react";
import { apiUrl } from "../api/restaurant-dashboard-api";
import type { RestaurantOrder } from "../types";

interface UseRestaurantRealtimeOptions {
  ownerLanguage: string;
  restaurantId: string;
  setOrders: (orders: RestaurantOrder[]) => void;
}

export function useRestaurantRealtime({
  ownerLanguage,
  restaurantId,
  setOrders,
}: UseRestaurantRealtimeOptions) {
  useEffect(() => {
    const events = new EventSource(
      `${apiUrl}/orders/events?restaurantId=${restaurantId}&language=${ownerLanguage}`,
    );
    const update = (event: Event) => {
      const payload = JSON.parse((event as MessageEvent).data);
      setOrders(payload.data ?? []);
    };
    events.addEventListener("snapshot", update);
    events.addEventListener("orders", update);
    return () => events.close();
  }, [ownerLanguage, restaurantId, setOrders]);
}
