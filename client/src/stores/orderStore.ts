import { create } from 'zustand';
import {
  clearOrdersByDate,
  listAllOrders,
  listOrderItems,
  listOrdersByDate,
  markServed,
  voidOrder,
  type OrderItemRow,
  type OrderRow,
} from '@/database/repositories/orderRepository';

export type OrderFilter = 'ALL' | 'PAID' | 'UNPAID' | 'SERVED' | 'NOT_SERVED';

interface OrderState {
  orders: OrderRow[];
  loading: boolean;
  filter: OrderFilter;
  loadToday: () => void;
  loadAll: () => void;
  setFilter: (f: OrderFilter) => void;
  applyFilter: () => void;
  markOrderServed: (id: number) => void;
  deleteOrder: (id: number) => void;
  clearAllToday: () => number;
  getOrderItems: (id: number) => OrderItemRow[];
}

function apply(f: OrderFilter, base: OrderRow[]): OrderRow[] {
  switch (f) {
    case 'PAID':
      return base.filter((o) => o.payment_status === 'PAID');
    case 'UNPAID':
      return base.filter((o) => o.payment_status === 'UNPAID');
    case 'SERVED':
      return base.filter((o) => o.serving_status === 'SERVED');
    case 'NOT_SERVED':
      return base.filter((o) => o.serving_status === 'NOT_SERVED');
    default:
      return base;
  }
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  loading: false,
  filter: 'ALL',

  loadToday() {
    set({ loading: true });
    const orders = apply(get().filter, listOrdersByDate(new Date().toISOString().slice(0, 10)));
    set({ orders, loading: false });
  },

  loadAll() {
    set({ loading: true });
    const orders = apply(get().filter, listAllOrders());
    set({ orders, loading: false });
  },

  setFilter(f) {
    set({ filter: f });
    get().applyFilter();
  },

  applyFilter() {
    const f = get().filter;
    if (f === 'ALL') {
      get().loadToday();
      return;
    }
    const all = listOrdersByDate(new Date().toISOString().slice(0, 10));
    set({ orders: apply(f, all) });
  },

  markOrderServed(id) {
    markServed(id);
    get().applyFilter();
  },

  deleteOrder(id) {
    voidOrder(id);
    get().applyFilter();
  },

  clearAllToday() {
    const today = new Date().toISOString().slice(0, 10);
    const { deleted } = clearOrdersByDate(today);
    get().applyFilter();
    return deleted;
  },

  getOrderItems(id) {
    return listOrderItems(id);
  },
}));
