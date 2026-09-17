import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authService } from './authService';
import type { Session, User } from './types';

interface AuthState {
  session: Session | null;
  isHydrated: boolean;
  isAuthenticating: boolean;
  isChangingPassword: boolean;
  hydrate: () => Promise<void>;
  login: (pin: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isHydrated: false,
  isAuthenticating: false,
  isChangingPassword: false,

  async hydrate() {
    const session = await authService.getSession();
    set({ session, isHydrated: true });
  },

  async login(pin) {
    set({ isAuthenticating: true });
    try {
      const session = await authService.login({ pin });
      set({ session, isAuthenticating: false });
    } catch (err) {
      set({ isAuthenticating: false });
      throw err;
    }
  },

  async changePassword(currentPassword, newPassword) {
    set({ isChangingPassword: true });
    try {
      await authService.changePassword(currentPassword, newPassword);
      set({ isChangingPassword: false });
    } catch (err) {
      set({ isChangingPassword: false });
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
