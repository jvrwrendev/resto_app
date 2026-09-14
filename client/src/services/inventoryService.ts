import {
  adjustStock,
  findProductById,
  type Product,
} from '@/database/repositories/productRepository';
import { AppError } from '@/utils/errors';

export interface AddStockInput {
  productId: number;
  quantity: number;
  note?: string;
}

export const inventoryService = {
  addStock({ productId, quantity, note }: AddStockInput): Product {
    if (quantity <= 0) throw new AppError('INVALID_INPUT');
    const product = findProductById(productId);
    if (!product) throw new AppError('NOT_FOUND');
    const balance = adjustStock(productId, quantity, 'IN', 'ADD_STOCK', note);
    return { ...product, current_stock: balance };
  },
};
