import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course } from '../types/course';
import { Assignment } from '../types/assignment';
import { OfflineMutation } from '../types/api';

const KEY_CACHED_COURSES = 'study_planner_cache_courses';
const KEY_CACHED_ASSIGNMENTS = 'study_planner_cache_assignments';
const KEY_OFFLINE_QUEUE = 'study_planner_offline_queue';
const KEY_LAST_SYNC_TIME = 'study_planner_last_sync_time';

export const offlineStorage = {
  // --- Cached Courses ---
  async getCachedCourses(): Promise<Course[]> {
    try {
      const raw = await AsyncStorage.getItem(KEY_CACHED_COURSES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async setCachedCourses(courses: Course[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEY_CACHED_COURSES, JSON.stringify(courses));
    } catch (e) {
      console.warn('Failed to cache courses:', e);
    }
  },

  // --- Cached Assignments ---
  async getCachedAssignments(): Promise<Assignment[]> {
    try {
      const raw = await AsyncStorage.getItem(KEY_CACHED_ASSIGNMENTS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async setCachedAssignments(assignments: Assignment[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEY_CACHED_ASSIGNMENTS, JSON.stringify(assignments));
    } catch (e) {
      console.warn('Failed to cache assignments:', e);
    }
  },

  // --- Offline Mutation Queue ---
  async getOfflineQueue(): Promise<OfflineMutation[]> {
    try {
      const raw = await AsyncStorage.getItem(KEY_OFFLINE_QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async saveOfflineQueue(queue: OfflineMutation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEY_OFFLINE_QUEUE, JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to save offline queue:', e);
    }
  },

  async enqueueMutation(
    entity: 'assignment' | 'course',
    action: 'create' | 'update' | 'toggle' | 'delete',
    payload: Record<string, any>
  ): Promise<OfflineMutation> {
    const queue = await this.getOfflineQueue();
    const mutation: OfflineMutation = {
      clientMutationId: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      entity,
      action,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    queue.push(mutation);
    await this.saveOfflineQueue(queue);
    return mutation;
  },

  async removeMutation(clientMutationId: string): Promise<void> {
    const queue = await this.getOfflineQueue();
    const filtered = queue.filter((m) => m.clientMutationId !== clientMutationId);
    await this.saveOfflineQueue(filtered);
  },

  async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEY_OFFLINE_QUEUE);
    } catch (e) {
      console.warn('Failed to clear queue:', e);
    }
  },

  // --- Last Sync Time ---
  async getLastSyncTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEY_LAST_SYNC_TIME);
    } catch {
      return null;
    }
  },

  async setLastSyncTime(isoTime: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEY_LAST_SYNC_TIME, isoTime);
    } catch (e) {
      console.warn('Failed to set last sync time:', e);
    }
  },

  async clearAllCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(KEY_CACHED_COURSES),
        AsyncStorage.removeItem(KEY_CACHED_ASSIGNMENTS),
        AsyncStorage.removeItem(KEY_OFFLINE_QUEUE),
        AsyncStorage.removeItem(KEY_LAST_SYNC_TIME),
      ]);
    } catch (e) {
      console.warn('Failed to clear cache:', e);
    }
  },
};
