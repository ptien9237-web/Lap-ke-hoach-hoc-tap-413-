import { describe, it, expect, beforeEach } from 'vitest';
import { offlineStorage } from '../src/services/offlineStorage';
import { Assignment } from '../src/types/assignment';

describe('Offline Storage and Edit Preservation Queue (Requirement 5.7 & 10)', () => {
  beforeEach(async () => {
    await offlineStorage.clearAllCache();
  });

  it('should enqueue offline mutations with unique clientMutationIds', async () => {
    const mut1 = await offlineStorage.enqueueMutation('assignment', 'create', {
      title: 'Bài tập tạo offline 1',
      dueAt: '2026-10-29T23:59:00Z',
    });

    const mut2 = await offlineStorage.enqueueMutation('assignment', 'toggle', {
      id: 'assign-123',
    });

    expect(mut1.clientMutationId).toBeDefined();
    expect(mut2.clientMutationId).toBeDefined();
    expect(mut1.clientMutationId).not.toBe(mut2.clientMutationId);

    const queue = await offlineStorage.getOfflineQueue();
    expect(queue.length).toBe(2);
    expect(queue[0].action).toBe('create');
    expect(queue[1].action).toBe('toggle');
  });

  it('should remove specific mutation upon successful sync', async () => {
    const mut = await offlineStorage.enqueueMutation('assignment', 'create', {
      title: 'Task to sync',
    });

    let queue = await offlineStorage.getOfflineQueue();
    expect(queue.length).toBe(1);

    await offlineStorage.removeMutation(mut.clientMutationId);

    queue = await offlineStorage.getOfflineQueue();
    expect(queue.length).toBe(0);
  });

  it('should cache and retrieve assignments persistently', async () => {
    const mockAssignments: Assignment[] = [
      {
        id: 'cached-1',
        courseId: 'c-1',
        title: 'Cached Assignment',
        dueAt: '2026-10-30T23:59:00Z',
        status: 'pending',
      },
    ];

    await offlineStorage.setCachedAssignments(mockAssignments);
    const retrieved = await offlineStorage.getCachedAssignments();

    expect(retrieved.length).toBe(1);
    expect(retrieved[0].title).toBe('Cached Assignment');
  });

  it('should save and retrieve last sync timestamp accurately', async () => {
    const syncTime = '2026-10-28T19:30:00.000Z';
    await offlineStorage.setLastSyncTime(syncTime);

    const retrieved = await offlineStorage.getLastSyncTime();
    expect(retrieved).toBe(syncTime);
  });
});
