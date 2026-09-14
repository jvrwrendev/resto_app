export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    name TEXT NOT NULL,
    price REAL NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    is_active INTEGER NOT NULL DEFAULT 1,
    image_uri TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INTEGER PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    type TEXT NOT NULL CHECK(type IN ('IN','OUT','ADJUST')),
    quantity INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reference TEXT,
    note TEXT,
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    subtotal REAL NOT NULL,
    total REAL NOT NULL,
    cash_received REAL NOT NULL DEFAULT 0,
    change_amount REAL NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL CHECK(payment_status IN ('UNPAID','PAID')),
    serving_status TEXT NOT NULL CHECK(serving_status IN ('NOT_SERVED','SERVED')),
    cashier_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    unit_price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal REAL NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS daily_sequences (
    date TEXT PRIMARY KEY,
    last_value INTEGER NOT NULL DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN','CASHIER'))
  );`,
  `CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS printers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    mac_address TEXT NOT NULL UNIQUE,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);`,
  `CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);`,
  `CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);`,
  `CREATE INDEX IF NOT EXISTS idx_inv_tx_product ON inventory_transactions(product_id);`,
];
