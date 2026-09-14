import { create } from 'zustand';
import type { CartLineItem } from '@/services/orderService';

interface CartState {
  items: CartLineItem[];
  addItem: (item: Omit<CartLineItem, 'quantity'>, qty?: number) => void;
  increaseQty: (productId: number) => void;
  decreaseQty: (productId: number) => void;
  setQty: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  setStock: (productId: number, availableStock: number) => void;
  refreshStockLimits: (products: Array<{ id: number; current_stock: number }>) => void;
  subtotal: () => number;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem(item, qty = 1) {
    const items = [...get().items];
    const existing = items.find((i) => i.productId === item.productId);
    if (existing) {
      const next = existing.quantity + qty;
      if (next > existing.availableStock) return;
      existing.quantity = next;
    } else {
      if (qty > item.availableStock) return;
      items.push({ ...item, quantity: qty });
    }
    set({ items });
  },

  increaseQty(productId) {
    const items = get().items.map((i) =>
      i.productId === productId
        ? { ...i, quantity: Math.min(i.availableStock, i.quantity + 1) }
        : i,
    );
    set({ items });
  },

  decreaseQty(productId) {
    const items = get()
      .items.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i))
      .filter((i) => i.quantity > 0);
    set({ items });
  },

  setQty(productId, quantity) {
    const items = get().items.map((i) => {
      if (i.productId !== productId) return i;
      const qty = Math.max(1, Math.min(i.availableStock, Math.floor(quantity) || 1));
      return { ...i, quantity: qty };
    });
    set({ items });
  },

  removeItem(productId) {
    set({ items: get().items.filter((i) => i.productId !== productId) });
  },

  clearCart() {
    set({ items: [] });
  },

  setStock(productId, availableStock) {
    const items = get().items.map((i) =>
      i.productId === productId
        ? { ...i, availableStock, quantity: Math.min(i.quantity, availableStock) }
        : i,
    );
    set({ items: items.filter((i) => i.quantity > 0) });
  },

  refreshStockLimits(products) {
    const map = new Map(products.map((p) => [p.id, p.current_stock]));
    const items = get()
      .items.map((i) => {
        const stock = map.get(i.productId);
        if (stock === undefined) return i;
        return { ...i, availableStock: stock, quantity: Math.min(i.quantity, stock) };
      })
      .filter((i) => i.quantity > 0);
    set({ items });
  },

  subtotal() {
    return get().items.reduce((s, it) => s + it.price * it.quantity, 0);
  },

  total() {
    return get().subtotal();
  },

  itemCount() {
    return get().items.reduce((s, it) => s + it.quantity, 0);
  },
}));
