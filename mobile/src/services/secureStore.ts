import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AuthUser } from '../types/api';

const TOKEN_KEY = 'study_planner_auth_token';
const USER_KEY = 'study_planner_auth_user';

// In-memory fallback for environments without SecureStore (e.g. web mock/SSR)
const memoryStorage = new Map<string, string>();

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch {
      memoryStorage.set(key, value);
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryStorage.get(key) || null;
    }
  }
  return await SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch {
      memoryStorage.delete(key);
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const secureStorage = {
  async saveToken(token: string): Promise<void> {
    await setItem(TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    return await getItem(TOKEN_KEY);
  },

  async removeToken(): Promise<void> {
    await deleteItem(TOKEN_KEY);
  },

  async saveUser(user: AuthUser): Promise<void> {
    await setItem(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<AuthUser | null> {
    const raw = await getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  async removeUser(): Promise<void> {
    await deleteItem(USER_KEY);
  },

  async clearAll(): Promise<void> {
    await deleteItem(TOKEN_KEY);
    await deleteItem(USER_KEY);
  },
};
