import { create } from 'zustand';
import { listActiveProducts, listProducts, type Product } from '@/database/repositories/productRepository';
import { listCategories, type Category } from '@/database/repositories/categoryRepository';

interface ProductState {
  products: Product[];
  categories: Category[];
  selectedCategoryId: number | null;
  loading: boolean;
  load: () => void;
  loadAdmin: () => void;
  setCategory: (id: number | null) => void;
  getById: (id: number) => Product | undefined;
  productsByCategory: () => Product[];
  refreshOne: (id: number) => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: [],
  selectedCategoryId: null,
  loading: false,

  load() {
    set({ loading: true });
    const categories = listCategories();
    const products = listActiveProducts();
    set({ products, categories, loading: false });
  },

  loadAdmin() {
    set({ loading: true });
    const categories = listCategories();
    const products = listProducts();
    set({ products, categories, loading: false });
  },

  setCategory(id) {
    set({ selectedCategoryId: id });
  },

  getById(id) {
    return get().products.find((p) => p.id === id);
  },

  productsByCategory() {
    const { products, selectedCategoryId } = get();
    if (selectedCategoryId == null) return products;
    return products.filter((p) => p.category_id === selectedCategoryId);
  },

  refreshOne(id) {
    const current = get().products;
    const products = listActiveProducts();
    if (current.some((p) => p.id === id)) {
      const next = products.find((p) => p.id === id);
      if (!next) {
        set({ products: current.filter((p) => p.id !== id) });
        return;
      }
      set({ products: current.map((p) => (p.id === id ? next : p)) });
    } else {
      set({ products });
    }
  },
}));
