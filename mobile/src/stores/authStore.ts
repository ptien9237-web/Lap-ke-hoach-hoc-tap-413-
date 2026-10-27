import { create } from 'zustand';
import { AuthUser, AuthResponseData } from '../types/api';
import { secureStorage } from '../services/secureStore';
import { api, ApiError } from '../services/api';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  checkSession: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  checkSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = await secureStorage.getToken();
      if (!token) {
        set({ user: null, token: null, isInitialized: true, isLoading: false });
        return false;
      }

      // Verify token with backend
      try {
        const res = await api.get<{ user: AuthUser }>('/api/auth/me');
        await secureStorage.saveUser(res.user);
        set({ user: res.user, token, isInitialized: true, isLoading: false });
        return true;
      } catch {
        // Token expired or revoked
        await secureStorage.clearAll();
        set({ user: null, token: null, isInitialized: true, isLoading: false });
        return false;
      }
    } catch {
      set({ user: null, token: null, isInitialized: true, isLoading: false });
      return false;
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<AuthResponseData>('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      await secureStorage.saveToken(res.token);
      await secureStorage.saveUser(res.user);

      set({
        user: res.user,
        token: res.token,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const message = err instanceof ApiError ? err.message : 'Đăng nhập không thành công. Vui lòng thử lại.';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<AuthResponseData>('/api/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      await secureStorage.saveToken(res.token);
      await secureStorage.saveUser(res.user);

      set({
        user: res.user,
        token: res.token,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const message = err instanceof ApiError ? err.message : 'Đăng ký không thành công. Vui lòng thử lại.';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.post('/api/auth/logout').catch(() => {});
    } finally {
      await secureStorage.clearAll();
      set({
        user: null,
        token: null,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

// --- SELECTORS ---
export const selectIsAuthenticated = (state: AuthState) => Boolean(state.token && state.user);
export const selectCurrentUser = (state: AuthState) => state.user;
export const selectAuthLoading = (state: AuthState) => state.isLoading;
export const selectAuthInitialized = (state: AuthState) => state.isInitialized;
export const selectAuthError = (state: AuthState) => state.error;

// Convenience selector hooks
export const useIsAuthenticated = () => useAuthStore(selectIsAuthenticated);
export const useCurrentUser = () => useAuthStore(selectCurrentUser);
export const useAuthLoading = () => useAuthStore(selectAuthLoading);
export const useAuthInitialized = () => useAuthStore(selectAuthInitialized);
export const useAuthError = () => useAuthStore(selectAuthError);
