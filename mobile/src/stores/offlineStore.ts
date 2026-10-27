import { create } from 'zustand';
import { offlineStorage } from '../services/offlineStorage';
import { syncService } from '../services/syncService';

interface OfflineState {
  isOffline: boolean;
  queueCount: number;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncError: string | null;

  // Actions
  setIsOffline: (offline: boolean) => void;
  refreshQueueCount: () => Promise<void>;
  performSync: () => Promise<boolean>;
  initOfflineState: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOffline: false,
  queueCount: 0,
  isSyncing: false,
  lastSyncTime: null,
  syncError: null,

  initOfflineState: async () => {
    const queue = await offlineStorage.getOfflineQueue();
    const lastTime = await offlineStorage.getLastSyncTime();
    set({ queueCount: queue.length, lastSyncTime: lastTime });
  },

  setIsOffline: (offline: boolean) => {
    set({ isOffline: offline });
    if (!offline) {
      // Auto-trigger sync when transitioning to online
      get().performSync();
    }
  },

  refreshQueueCount: async () => {
    const queue = await offlineStorage.getOfflineQueue();
    set({ queueCount: queue.length });
  },

  performSync: async () => {
    const { isSyncing, isOffline } = get();
    if (isSyncing || isOffline) return false;

    set({ isSyncing: true, syncError: null });

    try {
      const result = await syncService.processQueue();
      const lastTime = await offlineStorage.getLastSyncTime();
      const remainingQueue = await offlineStorage.getOfflineQueue();

      set({
        queueCount: remainingQueue.length,
        lastSyncTime: lastTime,
        isSyncing: false,
        syncError: result.failed > 0 ? `Còn ${result.failed} thao tác chưa được lưu lên máy chủ.` : null,
      });

      return result.succeeded > 0;
    } catch (err: any) {
      set({
        isSyncing: false,
        syncError: err.message || 'Không thể đồng bộ dữ liệu lúc này.',
      });
      return false;
    }
  },
}));

// --- SELECTORS ---
export const selectIsOffline = (state: OfflineState) => state.isOffline;
export const selectQueueCount = (state: OfflineState) => state.queueCount;
export const selectIsSyncing = (state: OfflineState) => state.isSyncing;
export const selectLastSyncTime = (state: OfflineState) => state.lastSyncTime;
export const selectSyncError = (state: OfflineState) => state.syncError;

export const useIsOffline = () => useOfflineStore(selectIsOffline);
export const useOfflineQueueCount = () => useOfflineStore(selectQueueCount);
export const useIsSyncing = () => useOfflineStore(selectIsSyncing);
export const useLastSyncTime = () => useOfflineStore(selectLastSyncTime);
export const useSyncError = () => useOfflineStore(selectSyncError);
