import { getDB } from './database';
import { DEFAULT_RECEIPT, LOW_STOCK_DEFAULT } from '@/constants';

function nowIso(): string {
  return new Date().toISOString();
}

function getSetting(key: string): string | null {
  const db = getDB();
  const row = db.getFirstSync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?;',
    [key],
  );
  return row?.value ?? null;
}

function setSetting(key: string, value: string): void {
  const db = getDB();
  db.runSync(
    'INSERT INTO app_settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
    [key, value],
  );
}

export function seedDatabase(): void {
  const db = getDB();
  const countRow = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM users;');
  const count = Number(countRow?.c ?? 0);

  if (count > 0) return;

  const now = nowIso();

  const cats: Array<[string, string, number]> = [
    ['BBQ', 'bbq', 1],
    ['Food', 'food', 2],
    ['Drinks', 'drinks', 3],
    ['Others', 'others', 4],
  ];
  for (const [name, slug, sort] of cats) {
    db.runSync(
      'INSERT INTO categories(name, slug, sort_order) VALUES(?, ?, ?);',
      [name, slug, sort],
    );
  }

  const products: Array<{
    name: string;
    price: number;
    category: string;
    stock: number;
    threshold?: number;
  }> = [
    { name: 'Pork BBQ', price: 25, category: 'BBQ', stock: 80 },
    { name: 'Chicken BBQ', price: 35, category: 'BBQ', stock: 60 },
    { name: 'Beef BBQ', price: 50, category: 'BBQ', stock: 40 },
    { name: 'Pork Belly', price: 80, category: 'BBQ', stock: 30 },
    { name: 'Rice', price: 15, category: 'Food', stock: 100 },
    { name: 'Sisig', price: 80, category: 'Food', stock: 20 },
    { name: 'Sinigang', price: 120, category: 'Food', stock: 15, threshold: 4 },
    { name: 'Coke', price: 25, category: 'Drinks', stock: 80 },
    { name: 'Water', price: 15, category: 'Drinks', stock: 100 },
    { name: 'Extra Sauce', price: 10, category: 'Others', stock: 200 },
  ];

  for (const p of products) {
    const cat = db.getFirstSync<{ id: number }>(
      'SELECT id FROM categories WHERE slug = ?;',
      [p.category],
    );
    const catId = cat?.id;
    if (!catId) continue;
    db.runSync(
      `INSERT INTO products(category_id, name, price, current_stock, low_stock_threshold, is_active, created_at, updated_at)
       VALUES(?, ?, ?, ?, ?, 1, ?, ?);`,
      [catId, p.name, p.price, p.stock, p.threshold ?? LOW_STOCK_DEFAULT, now, now],
    );
    const product = db.getFirstSync<{ id: number }>(
      'SELECT id FROM products WHERE name = ?;',
      [p.name],
    );
    const productId = product?.id;
    if (productId) {
      db.runSync(
        `INSERT INTO inventory_transactions(product_id, type, quantity, balance_after, reference, note, created_at)
         VALUES(?, 'IN', ?, ?, 'SEED', 'Initial stock', ?);`,
        [productId, p.stock, p.stock, now],
      );
    }
  }

  db.runSync(
    `INSERT INTO users(id, email, name, role) VALUES('u_admin', 'admin@bbqpos.com', 'Admin', 'ADMIN');`,
  );

  setSetting('storeName', DEFAULT_RECEIPT.storeName);
  setSetting('address', DEFAULT_RECEIPT.address);
  setSetting('contact', DEFAULT_RECEIPT.contact);
  setSetting('footer', DEFAULT_RECEIPT.footer);
  setSetting('autoPrint', 'true');
  setSetting('connectedPrinterName', '');
  setSetting('connectedPrinterMac', '');
}
