import { findProductById } from '@/database/repositories/productRepository';
import {
  insertOrderWithItems,
  type OrderRow,
  type OrderItemRow,
} from '@/database/repositories/orderRepository';
import { nextOrderNumber } from '@/database/repositories/sequenceRepository';
import { AppError } from '@/utils/errors';
import { paymentService } from './paymentService';
import { syncService } from './syncService';

export interface CartLineItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  availableStock: number;
}

export interface CheckoutInput {
  items: CartLineItem[];
  cashReceived: number;
  cashierId?: string;
  orderNumber?: string;
}

export interface CheckoutResult {
  orderId: number;
  orderNumber: string;
  total: number;
  cashReceived: number;
  change: number;
}

export const orderService = {
  checkout({ items, cashReceived, cashierId, orderNumber }: CheckoutInput): CheckoutResult {
    if (!items.length) throw new AppError('CART_EMPTY');

    for (const it of items) {
      if (it.quantity <= 0) throw new AppError('INVALID_INPUT');
      const p = findProductById(it.productId);
      if (!p) throw new AppError('NOT_FOUND');
      if (!p.is_active) throw new AppError('INSUFFICIENT_STOCK');
      if (it.quantity > p.current_stock) throw new AppError('INSUFFICIENT_STOCK');
    }

    const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const total = subtotal;
    const { change } = paymentService.calculate({ total, cashReceived });

    const resolvedNumber = orderNumber ?? nextOrderNumber();
    const now = new Date().toISOString();
    const orderInput: Omit<OrderRow, 'id'> = {
      order_number: resolvedNumber,
      subtotal,
      total,
      cash_received: cashReceived,
      change_amount: change,
      payment_status: 'PAID',
      serving_status: 'NOT_SERVED',
      cashier_id: cashierId ?? null,
      created_at: now,
      updated_at: now,
    };

    const itemInputs: Array<Omit<OrderItemRow, 'id' | 'order_id'>> = items.map((it) => ({
      product_id: it.productId,
      product_name: it.name,
      unit_price: it.price,
      quantity: it.quantity,
      subtotal: it.price * it.quantity,
    }));

    // Inserts the order and deducts product stock atomically in one transaction.
    const result = insertOrderWithItems(orderInput, itemInputs);

    syncService.enqueue({ type: 'ORDER_CREATED', orderId: result.orderId, orderNumber: resolvedNumber });

    return {
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      total,
      cashReceived,
      change,
    };
  },

  reserveOrderNumber(): string {
    return nextOrderNumber();
  },
};
