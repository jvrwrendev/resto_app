export type AppErrorCode =
  | 'INSUFFICIENT_STOCK'
  | 'PAYMENT_INSUFFICIENT'
  | 'CART_EMPTY'
  | 'PRINTER_NOT_FOUND'
  | 'PRINTER_CONNECT_FAIL'
  | 'PRINT_FAILED'
  | 'BLUETOOTH_PERMISSION_DENIED'
  | 'BLUETOOTH_DISABLED'
  | 'BLUETOOTH_SCAN_FAILED'
  | 'DB_INIT_FAILED'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED'
  | 'UNKNOWN';

export class AppError extends Error {
  code: AppErrorCode;
  constructor(code: AppErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

const messages: Record<AppErrorCode, string> = {
  INSUFFICIENT_STOCK: 'Insufficient stock',
  PAYMENT_INSUFFICIENT: 'Payment amount is insufficient',
  CART_EMPTY: 'Your cart is empty',
  PRINTER_NOT_FOUND: 'No Bluetooth printer found',
  PRINTER_CONNECT_FAIL: 'Unable to connect to printer',
  PRINT_FAILED: 'Transaction saved, but receipt printing failed',
  BLUETOOTH_PERMISSION_DENIED: 'Bluetooth permission denied',
  BLUETOOTH_DISABLED: 'Bluetooth is turned off',
  BLUETOOTH_SCAN_FAILED: 'Bluetooth scan could not start',
  DB_INIT_FAILED: 'Database initialization failed',
  NOT_FOUND: 'Item not found',
  INVALID_INPUT: 'Please check the entered values',
  UNAUTHORIZED: 'Please sign in to continue',
  UNKNOWN: 'Something went wrong. Please try again.',
};

export function toUserMessage(err: unknown): string {
  if (err instanceof AppError) return messages[err.code];
  if (err instanceof Error) return messages.UNKNOWN;
  return messages.UNKNOWN;
}
