import { Pool } from "pg";
import type { LocalizedText, MenuCategory, MenuItem, SubscriptionPlan } from "@scanmenu/shared";

export interface RestaurantRecord {
  id: string;
  name: string;
  operatingLanguage: string;
  currency: string;
  logoUrl?: string;
  supportedCustomerLanguages: string[];
  status: "draft" | "active" | "paused";
  ownerFirstName: string;
  ownerLastName: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  city: string;
  selectedPlan: SubscriptionPlan["id"];
}

export interface RestaurantTableRecord {
  id: string;
  restaurantId: string;
  number: string;
  qrPath: string;
}

const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

export function hasRestaurantDb() {
  return Boolean(pool);
}

export async function initRestaurantDatabase() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS scanmenu_restaurants (
      id text PRIMARY KEY,
      name text NOT NULL,
      operating_language text NOT NULL,
      default_currency text NOT NULL DEFAULT 'USD',
      logo_url text,
      supported_customer_languages jsonb NOT NULL DEFAULT '[]',
      status text NOT NULL DEFAULT 'active',
      owner_first_name text NOT NULL DEFAULT '',
      owner_last_name text NOT NULL DEFAULT '',
      email text NOT NULL DEFAULT '',
      phone text NOT NULL DEFAULT '',
      address text NOT NULL DEFAULT '',
      country text NOT NULL DEFAULT '',
      city text NOT NULL DEFAULT '',
      selected_plan text NOT NULL DEFAULT 'basic',
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS scanmenu_menu_categories (
      id text PRIMARY KEY,
      restaurant_id text NOT NULL REFERENCES scanmenu_restaurants(id) ON DELETE CASCADE,
      catalog_key text,
      name jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS scanmenu_menu_items (
      id text PRIMARY KEY,
      restaurant_id text NOT NULL REFERENCES scanmenu_restaurants(id) ON DELETE CASCADE,
      category_id text REFERENCES scanmenu_menu_categories(id) ON DELETE SET NULL,
      ingredient_ids jsonb NOT NULL DEFAULT '[]',
      name jsonb NOT NULL,
      description jsonb NOT NULL DEFAULT '{}',
      image_url text,
      price numeric(12, 2) NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'USD',
      is_available boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS scanmenu_restaurant_tables (
      id text PRIMARY KEY,
      restaurant_id text NOT NULL REFERENCES scanmenu_restaurants(id) ON DELETE CASCADE,
      number text NOT NULL,
      qr_path text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (restaurant_id, number)
    );
  `);

  await pool.query("ALTER TABLE scanmenu_restaurants ADD COLUMN IF NOT EXISTS default_currency text NOT NULL DEFAULT 'USD'");
  await pool.query("ALTER TABLE scanmenu_restaurants ADD COLUMN IF NOT EXISTS logo_url text");
  await pool.query("ALTER TABLE scanmenu_menu_categories ADD COLUMN IF NOT EXISTS catalog_key text");

  await pool.query(
    `INSERT INTO scanmenu_restaurants (
      id, name, operating_language, supported_customer_languages, status,
      owner_first_name, owner_last_name, email, phone, address, country, city, selected_plan, default_currency
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    ON CONFLICT (id) DO NOTHING`,
    [
      "rst_bistro_01",
      "Bistro Aurora",
      "ru",
      JSON.stringify(["ar", "en", "ru", "tr"]),
      "active",
      "Anna",
      "Petrova",
      "owner@bistro.local",
      "+7 900 100 20 30",
      "Tverskaya 10",
      "Russia",
      "Moscow",
      "premium",
      "RUB"
    ]
  );

  for (const name of ["r1", "r2", "r3", "r4", "r5"]) {
    await createRestaurantDb({
      id: `rst_${name}`,
      name,
      operatingLanguage: "ar",
      currency: "USD",
      supportedCustomerLanguages: ["ar", "en", "ru", "tr", "fr", "es", "de", "it", "pt", "zh", "ja", "ko", "hi", "ur", "fa", "he", "id", "ms", "uk", "pl", "nl", "sv", "el", "vi", "th"],
      status: "active",
      ownerFirstName: name,
      ownerLastName: "",
      email: `${name}@scanmenu.local`,
      phone: "",
      address: "",
      country: "",
      city: "",
      selectedPlan: "basic"
    });
  }
}

export async function getRestaurantsDb() {
  const result = await pool!.query("SELECT * FROM scanmenu_restaurants ORDER BY name");
  return result.rows.map(mapRestaurant);
}

export async function getRestaurantDb(id: string) {
  const result = await pool!.query("SELECT * FROM scanmenu_restaurants WHERE id = $1", [id]);
  return result.rows[0] ? mapRestaurant(result.rows[0]) : undefined;
}

export async function createRestaurantDb(entry: RestaurantRecord) {
  const result = await pool!.query(
    `INSERT INTO scanmenu_restaurants (
      id, name, operating_language, default_currency, logo_url, supported_customer_languages, status,
      owner_first_name, owner_last_name, email, phone, address, country, city, selected_plan
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      operating_language = EXCLUDED.operating_language,
      default_currency = EXCLUDED.default_currency,
      logo_url = EXCLUDED.logo_url,
      supported_customer_languages = EXCLUDED.supported_customer_languages,
      status = EXCLUDED.status,
      owner_first_name = EXCLUDED.owner_first_name,
      owner_last_name = EXCLUDED.owner_last_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      address = EXCLUDED.address,
      country = EXCLUDED.country,
      city = EXCLUDED.city,
      selected_plan = EXCLUDED.selected_plan,
      updated_at = now()
    RETURNING *`,
    [
      entry.id,
      entry.name,
      entry.operatingLanguage,
      entry.currency,
      entry.logoUrl ?? null,
      JSON.stringify(entry.supportedCustomerLanguages),
      entry.status,
      entry.ownerFirstName,
      entry.ownerLastName,
      entry.email,
      entry.phone,
      entry.address,
      entry.country,
      entry.city,
      entry.selectedPlan
    ]
  );
  return mapRestaurant(result.rows[0]);
}

export async function updateRestaurantProfileDb(id: string, patch: Partial<RestaurantRecord>) {
  const current = await getRestaurantDb(id);
  if (!current) return undefined;
  const next = { ...current, ...patch };
  const result = await pool!.query(
    `UPDATE scanmenu_restaurants SET
      name = $2,
      operating_language = $3,
      default_currency = $4,
      logo_url = $5,
      supported_customer_languages = $6,
      status = $7,
      owner_first_name = $8,
      owner_last_name = $9,
      email = $10,
      phone = $11,
      address = $12,
      country = $13,
      city = $14,
      selected_plan = $15,
      updated_at = now()
    WHERE id = $1
    RETURNING *`,
    [
      id,
      next.name,
      next.operatingLanguage,
      next.currency,
      next.logoUrl ?? null,
      JSON.stringify(next.supportedCustomerLanguages),
      next.status,
      next.ownerFirstName,
      next.ownerLastName,
      next.email,
      next.phone,
      next.address,
      next.country,
      next.city,
      next.selectedPlan
    ]
  );
  return mapRestaurant(result.rows[0]);
}

export async function getCategoriesDb(restaurantId: string) {
  const result = await pool!.query("SELECT * FROM scanmenu_menu_categories WHERE restaurant_id = $1 ORDER BY created_at", [restaurantId]);
  return result.rows.map(mapCategory);
}

export async function createCategoryDb(entry: MenuCategory) {
  await pool!.query(
    "INSERT INTO scanmenu_menu_categories (id, restaurant_id, catalog_key, name) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET catalog_key = EXCLUDED.catalog_key, name = EXCLUDED.name",
    [entry.id, entry.restaurantId, entry.catalogKey ?? null, JSON.stringify(entry.name)]
  );
  return entry;
}

export async function updateCategoryDb(entry: MenuCategory) {
  const result = await pool!.query(
    "UPDATE scanmenu_menu_categories SET catalog_key = $3, name = $4 WHERE id = $1 AND restaurant_id = $2 RETURNING *",
    [entry.id, entry.restaurantId, entry.catalogKey ?? null, JSON.stringify(entry.name)]
  );
  return result.rows[0] ? mapCategory(result.rows[0]) : undefined;
}

export async function deleteCategoryDb(restaurantId: string, categoryId: string) {
  await pool!.query("DELETE FROM scanmenu_menu_categories WHERE id = $1 AND restaurant_id = $2", [categoryId, restaurantId]);
}

export async function deleteRestaurantDb(restaurantId: string) {
  await pool!.query("DELETE FROM scanmenu_restaurants WHERE id = $1", [restaurantId]);
}

export async function getMenuItemsDb(restaurantId: string) {
  const result = await pool!.query("SELECT * FROM scanmenu_menu_items WHERE restaurant_id = $1 ORDER BY created_at", [restaurantId]);
  return result.rows.map(mapMenuItem);
}

export async function createMenuItemDb(item: MenuItem) {
  await pool!.query(
    `INSERT INTO scanmenu_menu_items (
      id, restaurant_id, category_id, ingredient_ids, name, description, image_url, price, currency, is_available
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (id) DO UPDATE SET
      category_id = EXCLUDED.category_id,
      ingredient_ids = EXCLUDED.ingredient_ids,
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      image_url = EXCLUDED.image_url,
      price = EXCLUDED.price,
      currency = EXCLUDED.currency,
      is_available = EXCLUDED.is_available,
      updated_at = now()`,
    [
      item.id,
      item.restaurantId,
      item.categoryId || null,
      JSON.stringify(item.ingredientIds ?? []),
      JSON.stringify(item.name),
      JSON.stringify(item.description),
      item.imageUrl ?? null,
      item.price,
      item.currency,
      item.isAvailable
    ]
  );
  return item;
}

export async function updateMenuItemDb(item: MenuItem) {
  const result = await pool!.query(
    `UPDATE scanmenu_menu_items SET
      category_id = $3,
      ingredient_ids = $4,
      name = $5,
      description = $6,
      image_url = $7,
      price = $8,
      currency = $9,
      is_available = $10,
      updated_at = now()
    WHERE id = $1 AND restaurant_id = $2
    RETURNING *`,
    [
      item.id,
      item.restaurantId,
      item.categoryId || null,
      JSON.stringify(item.ingredientIds ?? []),
      JSON.stringify(item.name),
      JSON.stringify(item.description),
      item.imageUrl ?? null,
      item.price,
      item.currency,
      item.isAvailable
    ]
  );
  return result.rows[0] ? mapMenuItem(result.rows[0]) : undefined;
}

export async function deleteMenuItemDb(restaurantId: string, menuItemId: string) {
  await pool!.query("DELETE FROM scanmenu_menu_items WHERE id = $1 AND restaurant_id = $2", [menuItemId, restaurantId]);
}

export async function getTablesDb(restaurantId: string) {
  const result = await pool!.query("SELECT * FROM scanmenu_restaurant_tables WHERE restaurant_id = $1 ORDER BY number", [restaurantId]);
  return result.rows.map(mapTable);
}

export async function createTableDb(table: RestaurantTableRecord) {
  const result = await pool!.query(
    `INSERT INTO scanmenu_restaurant_tables (id, restaurant_id, number, qr_path)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (restaurant_id, number) DO UPDATE SET qr_path = EXCLUDED.qr_path
     RETURNING *`,
    [table.id, table.restaurantId, table.number, table.qrPath]
  );
  return mapTable(result.rows[0]);
}

function mapRestaurant(row: Record<string, unknown>): RestaurantRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    operatingLanguage: String(row.operating_language),
    currency: String(row.default_currency ?? "USD"),
    logoUrl: row.logo_url ? String(row.logo_url) : undefined,
    supportedCustomerLanguages: Array.isArray(row.supported_customer_languages) ? row.supported_customer_languages.map(String) : [],
    status: String(row.status) as RestaurantRecord["status"],
    ownerFirstName: String(row.owner_first_name ?? ""),
    ownerLastName: String(row.owner_last_name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    address: String(row.address ?? ""),
    country: String(row.country ?? ""),
    city: String(row.city ?? ""),
    selectedPlan: String(row.selected_plan ?? "basic") as SubscriptionPlan["id"]
  };
}

function mapCategory(row: Record<string, unknown>): MenuCategory {
  return {
    id: String(row.id),
    restaurantId: String(row.restaurant_id),
    catalogKey: row.catalog_key ? String(row.catalog_key) : undefined,
    name: row.name as LocalizedText
  };
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

function mapTable(row: Record<string, unknown>): RestaurantTableRecord {
  return {
    id: String(row.id),
    restaurantId: String(row.restaurant_id),
    number: String(row.number),
    qrPath: String(row.qr_path)
  };
}
