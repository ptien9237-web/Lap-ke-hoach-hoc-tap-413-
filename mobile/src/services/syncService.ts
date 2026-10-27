import { api } from './api';
import { offlineStorage } from './offlineStorage';
import { SyncResponseData } from '../types/api';

export const syncService = {
  /**
   * Process all pending offline mutations against the backend /api/sync endpoint
   */
  async processQueue(): Promise<{ processed: number; succeeded: number; failed: number }> {
    const queue = await offlineStorage.getOfflineQueue();
    if (queue.length === 0) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    try {
      const response = await api.post<SyncResponseData>('/api/sync', {
        mutations: queue.map((m) => ({
          clientMutationId: m.clientMutationId,
          entity: m.entity,
          action: m.action,
          payload: m.payload,
        })),
      });

      let succeeded = 0;
      let failed = 0;

      for (const res of response.results) {
        if (res.success) {
          succeeded++;
          // Remove processed mutation from persistent queue
          await offlineStorage.removeMutation(res.clientMutationId);
        } else {
          failed++;
        }
      }

      await offlineStorage.setLastSyncTime(response.serverTime);

      return {
        processed: response.results.length,
        succeeded,
        failed,
      };
    } catch (err: any) {
      console.warn('Sync failed:', err.message);
      throw err;
    }
  },
};
