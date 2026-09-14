import {
  findOrderById,
  listOrderItems,
  type OrderRow,
  type OrderItemRow,
} from '@/database/repositories/orderRepository';
import { ensureSetting, getSetting } from './settingsService';
import { DEFAULT_RECEIPT } from '@/constants';
import { formatDateTime } from '@/utils/date';
import { formatPHP } from '@/utils/currency';

export interface ReceiptLine {
  qty: number;
  name: string;
  unitPrice: number;
  subtotal: number;
}

export interface ReceiptData {
  storeName: string;
  address: string;
  contact: string;
  footer: string;
  orderNumber: string;
  date: string;
  items: ReceiptLine[];
  subtotal: number;
  total: number;
  cashReceived: number;
  change: number;
  paymentStatus: string;
  paymentMethod: string;
  cashier: string;
}

const WIDTH = 32;

function pad(s: string, n: number): string {
  if (s.length >= n) return s.slice(0, n);
  return s + ' '.repeat(n - s.length);
}

function line(left: string, right: string): string {
  const space = WIDTH - left.length - right.length;
  if (space < 1) return pad(left, WIDTH);
  return left + ' '.repeat(space) + right;
}

function center(s: string): string {
  if (s.length >= WIDTH) return s.slice(0, WIDTH);
  const total = WIDTH - s.length;
  const left = Math.floor(total / 2);
  const right = total - left;
  return ' '.repeat(left) + s + ' '.repeat(right);
}

function hr(): string {
  return '-'.repeat(WIDTH);
}

export function buildReceipt(orderId: number): ReceiptData {
  const order = findOrderById(orderId);
  const items = listOrderItems(orderId);
  return assembleReceipt(order, items);
}

export function assembleReceipt(
  order: OrderRow | null,
  items: OrderItemRow[],
  options: { cashier?: string } = {},
): ReceiptData {
  const storeName = ensureSetting('storeName', DEFAULT_RECEIPT.storeName);
  const address = ensureSetting('address', DEFAULT_RECEIPT.address);
  const contact = ensureSetting('contact', DEFAULT_RECEIPT.contact);
  const footer = ensureSetting('footer', DEFAULT_RECEIPT.footer);

  const mapped = items.map((it) => ({
    qty: it.quantity,
    name: it.product_name,
    unitPrice: it.unit_price,
    subtotal: it.subtotal,
  }));

  return {
    storeName,
    address,
    contact,
    footer,
    orderNumber: order?.order_number ?? '',
    date: order ? formatDateTime(order.created_at) : '',
    items: mapped,
    subtotal: mapped.reduce((s, it) => s + it.subtotal, 0),
    total: order?.total ?? 0,
    cashReceived: order?.cash_received ?? 0,
    change: order?.change_amount ?? 0,
    paymentStatus: order?.payment_status ?? 'UNPAID',
    paymentMethod: 'CASH',
    cashier: options.cashier ?? '',
  };
}

export function receiptToText(r: ReceiptData): string {
  const lines: string[] = [];
  lines.push(center(r.storeName.toUpperCase()));
  lines.push(center(r.address));
  lines.push(center(r.contact));
  lines.push('');
  lines.push(center(`ORDER NO: ${r.orderNumber}`));
  lines.push(line('Date:', r.date));
  lines.push(hr());
  for (const it of r.items) {
    lines.push(it.name);
    lines.push(line(`  ${it.qty} x ${formatPHP(it.unitPrice)}`, formatPHP(it.subtotal)));
  }
  lines.push(hr());
  lines.push(line('SUBTOTAL', formatPHP(r.subtotal)));
  lines.push(line('TOTAL', formatPHP(r.total)));
  lines.push(line('CASH', formatPHP(r.cashReceived)));
  lines.push(line('CHANGE', formatPHP(r.change)));
  lines.push(line('PAYMENT', `${r.paymentMethod} ${r.paymentStatus}`));
  if (r.cashier) {
    lines.push(line('CASHIER', r.cashier));
  }
  lines.push(hr());
  lines.push(center(r.footer));
  lines.push('');
  return lines.join('\n');
}

export const receiptService = {
  build: buildReceipt,
  toText: receiptToText,
  width: WIDTH,
  assemble: assembleReceipt,
  getStoreName: () => getSetting('storeName') || DEFAULT_RECEIPT.storeName,
};
