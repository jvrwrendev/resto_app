import { getDB } from '../database';

export interface InventoryTxRow {
  id: number;
  product_id: number;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  balance_after: number;
  reference: string | null;
  note: string | null;
  created_at: string;
}

export function listTransactionsByProduct(productId: number): InventoryTxRow[] {
  const db = getDB();
  return db.getAllSync<InventoryTxRow>(
    'SELECT * FROM inventory_transactions WHERE product_id = ? ORDER BY id DESC;',
    [productId],
  );
}

export function listTodayTransactions(): InventoryTxRow[] {
  const db = getDB();
  return db.getAllSync<InventoryTxRow>(
    `SELECT * FROM inventory_transactions WHERE substr(created_at, 1, 10) = ? ORDER BY id DESC;`,
    [new Date().toISOString().slice(0, 10)],
  );
}
