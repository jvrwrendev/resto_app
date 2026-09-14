import * as SecureStore from 'expo-secure-store';
import { MOCK_CREDENTIALS } from '@/constants';
import type { LoginPayload, Session, User } from './types';

const SESSION_KEY = 'bbqpos.session';

const MOCK_USER: User = {
  id: 'u_admin',
  email: MOCK_CREDENTIALS.email,
  name: 'Admin',
  role: 'ADMIN',
};

function genToken(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

function expiresAt(): string {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
}

export const authService = {
  async login({ email, password }: LoginPayload): Promise<Session> {
    // TODO: replace with POST {NESTJS_BASE}/auth/login returning same Session shape.
    if (
      email.trim().toLowerCase() !== MOCK_CREDENTIALS.email.toLowerCase() ||
      password !== MOCK_CREDENTIALS.password
    ) {
      throw new Error('INVALID_CREDENTIALS');
    }
    const session: Session = {
      token: genToken(),
      user: MOCK_USER,
      expiresAt: expiresAt(),
    };
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },

  async getSession(): Promise<Session | null> {
    try {
      const raw = await SecureStore.getItemAsync(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as Session;
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        await SecureStore.deleteItemAsync(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },
};
