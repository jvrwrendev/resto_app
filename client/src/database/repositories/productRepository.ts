import { getDB } from '../database';

export interface Product {
  id: number;
  category_id: number;
  name: string;
  price: number;
  current_stock: number;
  low_stock_threshold: number;
  is_active: number;
  image_uri: string | null;
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_slug?: string;
}

export function listProducts(): Product[] {
  const db = getDB();
  return db.getAllSync<Product>(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM products p JOIN categories c ON c.id = p.category_id
     ORDER BY c.sort_order ASC, p.name ASC;`,
  );
}

export function listActiveProducts(): Product[] {
  const db = getDB();
  return db.getAllSync<Product>(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM products p JOIN categories c ON c.id = p.category_id
     WHERE p.is_active = 1
     ORDER BY c.sort_order ASC, p.name ASC;`,
  );
}

export function findProductById(id: number): Product | null {
  const db = getDB();
  return db.getFirstSync<Product>('SELECT * FROM products WHERE id = ?;', [id]) ?? null;
}

export function listLowStockProducts(): Product[] {
  const db = getDB();
  return db.getAllSync<Product>(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM products p JOIN categories c ON c.id = p.category_id
     WHERE p.is_active = 1 AND p.current_stock <= p.low_stock_threshold
     ORDER BY p.current_stock ASC;`,
  );
}

export function createProduct(input: {
  name: string;
  price: number;
  category_id: number;
  stock: number;
  threshold: number;
  image_uri?: string | null;
}): number {
  const db = getDB();
  const now = new Date().toISOString();
  const res = db.runSync(
    `INSERT INTO products(category_id, name, price, current_stock, low_stock_threshold, is_active, image_uri, created_at, updated_at)
     VALUES(?, ?, ?, ?, ?, 1, ?, ?, ?);`,
    [
      input.category_id,
      input.name,
      input.price,
      input.stock,
      input.threshold,
      input.image_uri ?? null,
      now,
      now,
    ],
  );
  return res.lastInsertRowId;
}

export function updateProduct(
  id: number,
  input: Partial<{
    name: string;
    price: number;
    category_id: number;
    low_stock_threshold: number;
    image_uri: string | null;
  }>,
): void {
  const db = getDB();
  const fields: string[] = [];
  const values: Array<string | number | null> = [];
  if (input.name !== undefined) {
    fields.push('name = ?');
    values.push(input.name);
  }
  if (input.price !== undefined) {
    fields.push('price = ?');
    values.push(input.price);
  }
  if (input.category_id !== undefined) {
    fields.push('category_id = ?');
    values.push(input.category_id);
  }
  if (input.low_stock_threshold !== undefined) {
    fields.push('low_stock_threshold = ?');
    values.push(input.low_stock_threshold);
  }
  if (input.image_uri !== undefined) {
    fields.push('image_uri = ?');
    values.push(input.image_uri);
  }
  if (!fields.length) return;
  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);
  db.runSync(`UPDATE products SET ${fields.join(', ')} WHERE id = ?;`, values);
}

export function setProductActive(id: number, active: boolean): void {
  const db = getDB();
  db.runSync('UPDATE products SET is_active = ?, updated_at = ? WHERE id = ?;', [
    active ? 1 : 0,
    new Date().toISOString(),
    id,
  ]);
}

export function adjustStock(
  productId: number,
  delta: number,
  type: 'IN' | 'OUT' | 'ADJUST',
  reference?: string,
  note?: string,
): number {
  const db = getDB();
  const now = new Date().toISOString();
  const product = findProductById(productId);
  if (!product) return 0;
  const newBalance = Math.max(0, product.current_stock + delta);
  db.runSync('UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?;', [
    newBalance,
    now,
    productId,
  ]);
  db.runSync(
    `INSERT INTO inventory_transactions(product_id, type, quantity, balance_after, reference, note, created_at)
     VALUES(?, ?, ?, ?, ?, ?, ?);`,
    [productId, type, delta, newBalance, reference ?? null, note ?? null, now],
  );
  return newBalance;
}
