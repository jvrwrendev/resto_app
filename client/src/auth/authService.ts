import * as SecureStore from 'expo-secure-store';
import { MOCK_CREDENTIALS } from '@/constants';
import type { LoginPayload, Session, User } from './types';

const SESSION_KEY = 'bbqpos.session';
const MOCK_PIN_KEY = 'bbqpos.mockPin';

const MOCK_USER: User = {
  id: 'u_admin',
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

async function getMockPin(): Promise<string> {
  const stored = await SecureStore.getItemAsync(MOCK_PIN_KEY);
  return stored ?? MOCK_CREDENTIALS.pin;
}

export const authService = {
  async login({ pin }: LoginPayload): Promise<Session> {
    const mockPin = await getMockPin();
    // TODO: replace with POST {NESTJS_BASE}/auth/login returning same Session shape.
    if (pin !== mockPin) {
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

  async changePassword(currentPin: string, newPin: string): Promise<void> {
    const mockPin = await getMockPin();
    if (currentPin !== mockPin) {
      throw new Error('INVALID_CURRENT_PASSWORD');
    }
    await SecureStore.setItemAsync(MOCK_PIN_KEY, newPin);
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