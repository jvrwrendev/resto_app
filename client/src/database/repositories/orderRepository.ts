import { getDB } from '../database';

export interface OrderRow {
  id: number;
  order_number: string;
  subtotal: number;
  total: number;
  cash_received: number;
  change_amount: number;
  payment_status: 'UNPAID' | 'PAID';
  serving_status: 'NOT_SERVED' | 'SERVED';
  cashier_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  image_uri?: string | null;
}

export function insertOrderWithItems(
  order: Omit<OrderRow, 'id'>,
  items: Array<Omit<OrderItemRow, 'id' | 'order_id'>>,
): { orderId: number; orderNumber: string } {
  const db = getDB();
  let orderId = 0;
  db.execSync('BEGIN IMMEDIATE;');
  try {
    const orderRes = db.runSync(
      `INSERT INTO orders(order_number, subtotal, total, cash_received, change_amount, payment_status, serving_status, cashier_id, created_at, updated_at)
       VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        order.order_number,
        order.subtotal,
        order.total,
        order.cash_received,
        order.change_amount,
        order.payment_status,
        order.serving_status,
        order.cashier_id,
        order.created_at,
        order.updated_at,
      ],
    );
    orderId = orderRes.lastInsertRowId;
    for (const item of items) {
      const product = db.getFirstSync<{ current_stock: number }>(
        'SELECT current_stock FROM products WHERE id = ?;',
        [item.product_id],
      );
      if (!product || item.quantity > product.current_stock) {
        throw new Error('INSUFFICIENT_STOCK');
      }
      db.runSync(
        `INSERT INTO order_items(order_id, product_id, product_name, unit_price, quantity, subtotal)
         VALUES(?, ?, ?, ?, ?, ?);`,
        [orderId, item.product_id, item.product_name, item.unit_price, item.quantity, item.subtotal],
      );
      const newBalance = Math.max(0, product.current_stock - item.quantity);
      db.runSync('UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?;', [
        newBalance,
        order.updated_at,
        item.product_id,
      ]);
      db.runSync(
        `INSERT INTO inventory_transactions(product_id, type, quantity, balance_after, reference, note, created_at)
         VALUES(?, 'OUT', ?, ?, ?, 'Sale', ?);`,
        [item.product_id, -item.quantity, newBalance, order.order_number, order.created_at],
      );
    }
    db.execSync('COMMIT;');
  } catch (e) {
    db.execSync('ROLLBACK;');
    throw e;
  }
  return { orderId, orderNumber: order.order_number };
}

export function voidOrder(orderId: number): void {
  const db = getDB();
  const now = new Date().toISOString();
  db.execSync('BEGIN IMMEDIATE;');
  try {
    const order = db.getFirstSync<OrderRow>('SELECT * FROM orders WHERE id = ?;', [orderId]);
    if (!order) throw new Error('NOT_FOUND');
    const items = db.getAllSync<OrderItemRow>(
      'SELECT * FROM order_items WHERE order_id = ?;',
      [orderId],
    );
    for (const it of items) {
      const product = db.getFirstSync<{ current_stock: number }>(
        'SELECT current_stock FROM products WHERE id = ?;',
        [it.product_id],
      );
      const newBalance = (product?.current_stock ?? 0) + it.quantity;
      db.runSync('UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?;', [
        newBalance,
        now,
        it.product_id,
      ]);
      db.runSync(
        `INSERT INTO inventory_transactions(product_id, type, quantity, balance_after, reference, note, created_at)
         VALUES(?, 'IN', ?, ?, ?, 'Void: order cancelled', ?);`,
        [it.product_id, it.quantity, newBalance, order.order_number, now],
      );
    }
    db.runSync('DELETE FROM order_items WHERE order_id = ?;', [orderId]);
    db.runSync('DELETE FROM orders WHERE id = ?;', [orderId]);
    db.execSync('COMMIT;');
  } catch (e) {
    db.execSync('ROLLBACK;');
    throw e;
  }
}

export function listOrdersByDate(date: string): OrderRow[] {
  const db = getDB();
  return db.getAllSync<OrderRow>(
    `SELECT * FROM orders WHERE substr(created_at, 1, 10) = ? ORDER BY id DESC;`,
    [date],
  );
}

export function listAllOrders(): OrderRow[] {
  const db = getDB();
  return db.getAllSync<OrderRow>(
    'SELECT * FROM orders ORDER BY id DESC LIMIT 200;',
  );
}

export function clearOrdersByDate(date: string): { deleted: number } {
  const db = getDB();
  const now = new Date().toISOString();
  db.execSync('BEGIN IMMEDIATE;');
  let deleted = 0;
  try {
    const orders = db.getAllSync<OrderRow>(
      `SELECT * FROM orders WHERE substr(created_at, 1, 10) = ?;`,
      [date],
    );
    for (const order of orders) {
      const items = db.getAllSync<OrderItemRow>(
        'SELECT * FROM order_items WHERE order_id = ?;',
        [order.id],
      );
      for (const it of items) {
        const product = db.getFirstSync<{ current_stock: number }>(
          'SELECT current_stock FROM products WHERE id = ?;',
          [it.product_id],
        );
        const newBalance = (product?.current_stock ?? 0) + it.quantity;
        db.runSync('UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?;', [
          newBalance,
          now,
          it.product_id,
        ]);
        db.runSync(
          `INSERT INTO inventory_transactions(product_id, type, quantity, balance_after, reference, note, created_at)
           VALUES(?, 'IN', ?, ?, ?, 'Clear-all: orders cleared', ?);`,
          [it.product_id, it.quantity, newBalance, order.order_number, now],
        );
      }
    }
    const res = db.runSync(
      `DELETE FROM orders WHERE substr(created_at, 1, 10) = ?;`,
      [date],
    );
    deleted = res.changes;
    db.execSync('COMMIT;');
  } catch (e) {
    db.execSync('ROLLBACK;');
    throw e;
  }
  return { deleted };
}

export function findOrderById(id: number): OrderRow | null {
  const db = getDB();
  return db.getFirstSync<OrderRow>('SELECT * FROM orders WHERE id = ?;', [id]) ?? null;
}

export function findOrderByNumber(orderNumber: string): OrderRow | null {
  const db = getDB();
  return (
    db.getFirstSync<OrderRow>('SELECT * FROM orders WHERE order_number = ?;', [orderNumber]) ?? null
  );
}

export function listOrderItems(orderId: number): OrderItemRow[] {
  const db = getDB();
  return db.getAllSync<OrderItemRow>(
    `SELECT oi.*, p.image_uri AS image_uri
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?
     ORDER BY oi.id ASC;`,
    [orderId],
  );
}

export function markServed(orderId: number): void {
  const db = getDB();
  db.runSync('UPDATE orders SET serving_status = ?, updated_at = ? WHERE id = ?;', [
    'SERVED',
    new Date().toISOString(),
    orderId,
  ]);
}

export function markUnpaid(id: number): void {
  const db = getDB();
  db.runSync('UPDATE orders SET payment_status = ?, updated_at = ? WHERE id = ?;', [
    'UNPAID',
    new Date().toISOString(),
    id,
  ]);
}

interface StatsOrderRow {
  payment_status: 'UNPAID' | 'PAID';
  serving_status: 'NOT_SERVED' | 'SERVED';
  total: number;
}

interface StatsItemRow {
  quantity: number;
}

export function todayStats(date: string): {
  totalSales: number;
  orderCount: number;
  itemsSold: number;
  paidCount: number;
  unpaidCount: number;
  notServedCount: number;
  servedCount: number;
} {
  const db = getDB();
  const orders = db.getAllSync<StatsOrderRow>(
    `SELECT payment_status, serving_status, total FROM orders WHERE substr(created_at, 1, 10) = ?;`,
    [date],
  );
  const items = db.getAllSync<StatsItemRow>(
    `SELECT oi.quantity FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE substr(o.created_at, 1, 10) = ? AND o.payment_status = 'PAID';`,
    [date],
  );
  const totalSales = orders
    .filter((o) => o.payment_status === 'PAID')
    .reduce((sum, o) => sum + o.total, 0);
  return {
    totalSales,
    orderCount: orders.length,
    itemsSold: items.reduce((sum, i) => sum + i.quantity, 0),
    paidCount: orders.filter((o) => o.payment_status === 'PAID').length,
    unpaidCount: orders.filter((o) => o.payment_status === 'UNPAID').length,
    notServedCount: orders.filter((o) => o.serving_status === 'NOT_SERVED').length,
    servedCount: orders.filter((o) => o.serving_status === 'SERVED').length,
  };
}

interface HourRow {
  hour: number;
  total: number;
}

export function hourlySales(date: string): Array<{ hour: number; total: number }> {
  const db = getDB();
  const rows = db.getAllSync<HourRow>(
    `SELECT CAST(substr(created_at, 12, 2) AS INTEGER) AS hour, total
     FROM orders
     WHERE substr(created_at, 1, 10) = ? AND payment_status = 'PAID';`,
    [date],
  );
  const buckets: Record<number, number> = {};
  for (const r of rows) {
    buckets[r.hour] = (buckets[r.hour] ?? 0) + r.total;
  }
  return Object.keys(buckets)
    .map((h) => ({ hour: Number(h), total: buckets[Number(h)] }))
    .sort((a, b) => a.hour - b.hour);
}
