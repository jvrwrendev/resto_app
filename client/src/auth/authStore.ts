import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authService } from './authService';
import type { Session, User } from './types';

interface AuthState {
  session: Session | null;
  isHydrated: boolean;
  isAuthenticating: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isHydrated: false,
  isAuthenticating: false,

  async hydrate() {
    const session = await authService.getSession();
    set({ session, isHydrated: true });
  },

  async login(email, password) {
    set({ isAuthenticating: true });
    try {
      const session = await authService.login({ email, password });
      set({ session, isAuthenticating: false });
    } catch (err) {
      set({ isAuthenticating: false });
      throw err;
    }
  },

  async logout() {
    await authService.logout();
    await SecureStore.deleteItemAsync('bbqpos.session');
    set({ session: null });
  },
}));

export function currentUser(state: AuthState): User | null {
  return state.session?.user ?? null;
}
