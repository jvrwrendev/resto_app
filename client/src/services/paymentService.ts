import { AppError } from '@/utils/errors';

export interface PaymentInput {
  total: number;
  cashReceived: number;
}

export interface PaymentResult {
  total: number;
  cashReceived: number;
  change: number;
}

export const paymentService = {
  calculate({ total, cashReceived }: PaymentInput): PaymentResult {
    if (total <= 0) throw new AppError('CART_EMPTY');
    if (cashReceived < total) throw new AppError('PAYMENT_INSUFFICIENT');
    return {
      total,
      cashReceived,
      change: Math.round((cashReceived - total) * 100) / 100,
    };
  },
};
