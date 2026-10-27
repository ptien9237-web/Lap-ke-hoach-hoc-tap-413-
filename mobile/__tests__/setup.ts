import { vi } from 'vitest';

// In-memory mock for AsyncStorage in unit tests
const mockStorage = new Map<string, string>();

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => mockStorage.get(key) || null),
    setItem: vi.fn(async (key: string, value: string) => {
      mockStorage.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      mockStorage.delete(key);
    }),
    multiRemove: vi.fn(async (keys: string[]) => {
      keys.forEach((k) => mockStorage.delete(k));
    }),
    clear: vi.fn(async () => {
      mockStorage.clear();
    }),
  },
}));

// In-memory mock for expo-secure-store
const mockSecureStorage = new Map<string, string>();

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async (key: string) => mockSecureStorage.get(key) || null),
  setItemAsync: vi.fn(async (key: string, value: string) => {
    mockSecureStorage.set(key, value);
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    mockSecureStorage.delete(key);
  }),
}));
