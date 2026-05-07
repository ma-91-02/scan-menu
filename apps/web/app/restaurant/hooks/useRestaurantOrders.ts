import { useMemo, useState } from "react";
import { patchRestaurantOrder } from "../api/restaurant-dashboard-api";
import type { RestaurantOrder, TextLookup } from "../types";

export function useRestaurantOrders(text: TextLookup) {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) => !["completed", "cancelled"].includes(order.status),
      ),
    [orders],
  );
  const kitchenOrders = activeOrders.filter(
    (order) => order.type !== "waiter_request",
  );
  const waiterRequests = activeOrders.filter(
    (order) => order.type === "waiter_request",
  );
  const paymentLabel = (value?: string) => text(`payment.${value ?? "cash"}`);
  const statusLabel = (value?: string) => text(`status.${value ?? "pending"}`);

  return {
    activeOrders,
    kitchenOrders,
    orders,
    paymentLabel,
    statusLabel,
    waiterRequests,
    patchOrder: patchRestaurantOrder,
    setOrders,
  };
}
