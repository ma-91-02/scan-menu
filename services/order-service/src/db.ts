import { Pool } from "pg";
import type { LocalizedText, MenuItem, Order } from "@scanmenu/shared";

const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

export function hasOrderDb() {
  return Boolean(pool);
}

export async function initOrderDatabase() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS scanmenu_orders (
      id text PRIMARY KEY,
      restaurant_id text NOT NULL,
      customer_id text NOT NULL,
      table_number text,
      customer_language text NOT NULL,
      restaurant_language text NOT NULL,
      status text NOT NULL,
      payment_method text,
      payment_status text,
      type text NOT NULL DEFAULT 'order',
      lines jsonb NOT NULL DEFAULT '[]',
      total numeric(12,2) NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'USD',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

export async function getRestaurantLanguageDb(restaurantId: string) {
  const result = await pool!.query("SELECT operating_language FROM scanmenu_restaurants WHERE id = $1", [restaurantId]);
  return result.rows[0]?.operating_language ? String(result.rows[0].operating_language) : undefined;
}

export async function getMenuItemsDb(restaurantId: string) {
  const result = await pool!.query("SELECT * FROM scanmenu_menu_items WHERE restaurant_id = $1 AND is_available = true", [restaurantId]);
  return result.rows.map(mapMenuItem);
}

export async function getOrdersDb(query: { restaurantId?: string; customerId?: string }) {
  const result = await pool!.query(
    `SELECT * FROM scanmenu_orders
     WHERE ($1::text IS NULL OR restaurant_id = $1)
       AND ($2::text IS NULL OR customer_id = $2)
     ORDER BY created_at DESC`,
    [query.restaurantId ?? null, query.customerId ?? null]
  );
  return result.rows.map(mapOrder);
}

export async function createOrderDb(order: Order) {
  await pool!.query(
    `INSERT INTO scanmenu_orders (
      id, restaurant_id, customer_id, table_number, customer_language, restaurant_language,
      status, payment_method, payment_status, type, lines, total, currency, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      order.id,
      order.restaurantId,
      order.customerId,
      order.tableNumber ?? null,
      order.customerLanguage,
      order.restaurantLanguage,
      order.status,
      order.paymentMethod ?? null,
      order.paymentStatus ?? null,
      order.type ?? "order",
      JSON.stringify(order.lines),
      order.total,
      order.currency,
      order.createdAt
    ]
  );
  return order;
}

export async function updateOrderDb(order: Order) {
  const result = await pool!.query(
    `UPDATE scanmenu_orders SET
      status = $2,
      payment_method = $3,
      payment_status = $4,
      lines = $5,
      total = $6,
      updated_at = now()
    WHERE id = $1
    RETURNING *`,
    [order.id, order.status, order.paymentMethod ?? null, order.paymentStatus ?? null, JSON.stringify(order.lines), order.total]
  );
  return result.rows[0] ? mapOrder(result.rows[0]) : undefined;
}

export async function deleteOrdersByRestaurantDb(restaurantId: string) {
  await pool!.query("DELETE FROM scanmenu_orders WHERE restaurant_id = $1", [restaurantId]);
}

export async function deleteOrdersByCustomerDb(customerId: string) {
  await pool!.query("DELETE FROM scanmenu_orders WHERE customer_id = $1", [customerId]);
}

function mapMenuItem(row: Record<string, unknown>): MenuItem {
  return {
    id: String(row.id),
    restaurantId: String(row.restaurant_id),
    categoryId: row.category_id ? String(row.category_id) : undefined,
    ingredientIds: Array.isArray(row.ingredient_ids) ? row.ingredient_ids.map(String) : [],
    name: row.name as LocalizedText,
    description: row.description as LocalizedText,
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    price: Number(row.price ?? 0),
    currency: String(row.currency ?? "USD") as MenuItem["currency"],
    isAvailable: Boolean(row.is_available)
  };
}

function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    restaurantId: String(row.restaurant_id),
    customerId: String(row.customer_id),
    tableNumber: row.table_number ? String(row.table_number) : undefined,
    customerLanguage: String(row.customer_language),
    restaurantLanguage: String(row.restaurant_language),
    status: String(row.status) as Order["status"],
    paymentMethod: row.payment_method ? (String(row.payment_method) as Order["paymentMethod"]) : undefined,
    paymentStatus: row.payment_status ? (String(row.payment_status) as Order["paymentStatus"]) : undefined,
    type: String(row.type ?? "order") as Order["type"],
    lines: Array.isArray(row.lines) ? (row.lines as Order["lines"]) : [],
    total: Number(row.total ?? 0),
    currency: String(row.currency ?? "USD") as Order["currency"],
    createdAt: new Date(String(row.created_at)).toISOString()
  };
}
