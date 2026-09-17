export type Role = 'ADMIN' | 'CASHIER';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface Session {
  token: string;
  user: User;
  expiresAt: string;
}

export interface LoginPayload {
  pin: string;
}
