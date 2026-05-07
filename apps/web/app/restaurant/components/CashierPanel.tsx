import type { RestaurantOrder, TextLookup } from "../types";

interface CashierPanelProps {
  orders: RestaurantOrder[];
  paymentLabel: (value?: string) => string;
  text: TextLookup;
  onPatchOrder: (path: string, body: Record<string, unknown>) => void;
}

export function CashierPanel({
  orders,
  paymentLabel,
  text,
  onPatchOrder,
}: CashierPanelProps) {
  return (
    <section className="cashier-board">
      <div className="cashier-orders">
        {orders.map((order) => (
          <article className="cashier-table" key={order.id}>
            <h3>
              {text("restaurant.table")} {order.tableNumber ?? "-"}
            </h3>
            <p>
              {order.displayLines?.map((line) => (
                <span key={line.menuItemId}>
                  {line.quantity} {line.displayName}
                </span>
              ))}
            </p>
            <strong>
              {order.total} {order.currency}
            </strong>
            <strong>
              {paymentLabel(order.paymentMethod)} /{" "}
              {paymentLabel(order.paymentStatus ?? "unpaid")}
            </strong>
            <button
              type="button"
              onClick={() =>
                void onPatchOrder(`/orders/${order.id}/payment`, {
                  paymentMethod: order.paymentMethod ?? "cash",
                  paymentStatus: "paid",
                })
              }
            >
              {text("common.paid")}
            </button>
            <button
              type="button"
              onClick={() =>
                void onPatchOrder(`/orders/${order.id}/status`, {
                  status: "cancelled",
                })
              }
            >
              {text("common.cancel")}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
