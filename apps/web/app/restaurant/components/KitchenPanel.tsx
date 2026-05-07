import type { RestaurantOrder, TextLookup } from "../types";

interface KitchenPanelProps {
  orders: RestaurantOrder[];
  statusLabel: (value?: string) => string;
  text: TextLookup;
  onPatchOrder: (path: string, body: Record<string, unknown>) => void;
}

export function KitchenPanel({
  orders,
  statusLabel,
  text,
  onPatchOrder,
}: KitchenPanelProps) {
  return (
    <section className="kitchen-grid focused-kitchen">
      {orders.map((order) => (
        <article className="kitchen-ticket" key={order.id}>
          <h3>
            {text("restaurant.table")} {order.tableNumber ?? "-"}
          </h3>
          <span className="status-chip preparing">
            {statusLabel(order.status)}
          </span>
          {order.displayLines?.map((line) => (
            <label key={`${order.id}-${line.menuItemId}`}>
              <span>
                {line.quantity} {line.displayName}
                {line.displayRemovedIngredients?.length
                  ? ` | ${text("order.removed")}: ${line.displayRemovedIngredients.join(", ")}`
                  : ""}
              </span>
              <button
                type="button"
                onClick={() =>
                  void onPatchOrder(
                    `/orders/${order.id}/lines/${line.menuItemId}/status`,
                    {
                      kitchenStatus:
                        line.kitchenStatus === "ready" ? "preparing" : "ready",
                    },
                  )
                }
              >
                {statusLabel(line.kitchenStatus)}
              </button>
            </label>
          ))}
        </article>
      ))}
    </section>
  );
}
