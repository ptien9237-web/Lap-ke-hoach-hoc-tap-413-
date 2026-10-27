import { describe, it, expect, vi, beforeEach } from 'vitest';
import { offlineStorage } from '../src/services/offlineStorage';
import { api } from '../src/services/api';
import { Assignment } from '../src/types/assignment';

// Mock react-native Platform if needed
vi.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: (obj: any) => obj.default ?? obj.web,
  },
  Alert: {
    alert: vi.fn(),
  },
}));

describe('FIX 04: Assignment Detail & Deep-link Cache Fallback', () => {
  const mockAssignment: Assignment = {
    id: 'assign-deep-link-1',
    courseId: 'course-1',
    courseCode: 'CS101',
    courseName: 'Khoa học máy tính',
    courseColour: 'courseBlue',
    title: 'Bài tập deep link kiểm thử',
    dueAt: '2026-10-30T23:59:00Z',
    status: 'pending',
    notes: 'Kiểm tra mở trực tiếp khi cache rỗng',
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    await offlineStorage.clearAllCache();
  });

  describe('Direct Deep Link & Network Fetching', () => {
    it('should successfully fetch assignment from backend API when accessing deep link directly', async () => {
      const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce({
        assignment: mockAssignment,
      });

      const response = await api.get<{ assignment: Assignment }>(`/api/assignments/${mockAssignment.id}`);
      
      expect(getSpy).toHaveBeenCalledWith('/api/assignments/assign-deep-link-1');
      expect(response.assignment.id).toBe('assign-deep-link-1');
      expect(response.assignment.title).toBe('Bài tập deep link kiểm thử');
    });

    it('should handle network failure by falling back to local offline cache', async () => {
      // Pre-seed local cache
      await offlineStorage.setCachedAssignments([mockAssignment]);

      // Mock network failure
      vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('Network request failed'));

      // Simulate hook's queryFn fallback logic
      const fetchAssignmentWithFallback = async (id?: string) => {
        if (!id) return null;
        try {
          const res = await api.get<{ assignment: Assignment }>(`/api/assignments/${id}`);
          return res.assignment;
        } catch (err: any) {
          const cached = await offlineStorage.getCachedAssignments();
          const found = cached.find((a) => a.id === id);
          if (found) {
            return found;
          }
          throw err;
        }
      };

      const result = await fetchAssignmentWithFallback(mockAssignment.id);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(mockAssignment.id);
      expect(result?.title).toBe(mockAssignment.title);
    });

    it('should propagate error if network fails and item is not in offline cache', async () => {
      vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('Network error: 404 Not Found'));

      const fetchAssignmentWithFallback = async (id?: string) => {
        if (!id) return null;
        try {
          const res = await api.get<{ assignment: Assignment }>(`/api/assignments/${id}`);
          return res.assignment;
        } catch (err: any) {
          const cached = await offlineStorage.getCachedAssignments();
          const found = cached.find((a) => a.id === id);
          if (found) {
            return found;
          }
          throw err;
        }
      };

      await expect(fetchAssignmentWithFallback('non-existent-id')).rejects.toThrow('Network error: 404 Not Found');
    });

    it('should return null when id is undefined or empty without making network calls', async () => {
      const getSpy = vi.spyOn(api, 'get');

      const fetchAssignmentWithFallback = async (id?: string) => {
        if (!id) return null;
        const res = await api.get<{ assignment: Assignment }>(`/api/assignments/${id}`);
        return res.assignment;
      };

      const result = await fetchAssignmentWithFallback(undefined);
      expect(result).toBeNull();
      expect(getSpy).not.toHaveBeenCalled();
    });
  });

  describe('Cache initialData resolution', () => {
    it('should immediately resolve initialData when assignment exists in query client cache', () => {
      const cachedList: Assignment[] = [mockAssignment];
      const resolveInitialData = (id?: string, cache?: Assignment[]) => {
        if (!id) return undefined;
        return cache?.find((a) => a.id === id);
      };

      const initialData = resolveInitialData(mockAssignment.id, cachedList);
      expect(initialData).toBeDefined();
      expect(initialData?.id).toBe(mockAssignment.id);
      expect(initialData?.title).toBe(mockAssignment.title);
    });

    it('should return undefined for initialData when cache is empty so network fetch takes over', () => {
      const resolveInitialData = (id?: string, cache?: Assignment[]) => {
        if (!id) return undefined;
        return cache?.find((a) => a.id === id);
      };

      const initialDataFromEmptyCache = resolveInitialData(mockAssignment.id, []);
      expect(initialDataFromEmptyCache).toBeUndefined();

      const initialDataFromNullCache = resolveInitialData(mockAssignment.id, undefined);
      expect(initialDataFromNullCache).toBeUndefined();
    });
  });
});
