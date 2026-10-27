import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import { useOfflineStore } from '../stores/offlineStore';
import { Course, CreateCourseInput, UpdateCourseInput } from '../types/course';

export const COURSES_QUERY_KEY = ['courses'];

export function useCourses() {
  const queryClient = useQueryClient();
  const isOffline = useOfflineStore((s) => s.isOffline);
  const refreshQueueCount = useOfflineStore((s) => s.refreshQueueCount);

  const query = useQuery({
    queryKey: COURSES_QUERY_KEY,
    queryFn: async () => {
      try {
        const res = await api.get<{ courses: Course[] }>('/api/courses');
        await offlineStorage.setCachedCourses(res.courses);
        return res.courses;
      } catch (err: any) {
        // Fallback to local cache if network fails or offline
        const cached = await offlineStorage.getCachedCourses();
        if (cached.length > 0) {
          useOfflineStore.getState().setIsOffline(true);
          return cached;
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const createCourseMutation = useMutation({
    mutationFn: async (input: CreateCourseInput) => {
      if (isOffline) {
        const localCourse: Course = {
          id: `local_course_${Date.now()}`,
          code: input.code,
          name: input.name,
          colour: input.colour,
          created_at: new Date().toISOString(),
        };
        await offlineStorage.enqueueMutation('course', 'create', localCourse);
        await refreshQueueCount();

        // Optimistically add to cached courses
        const cached = await offlineStorage.getCachedCourses();
        const updated = [...cached, localCourse];
        await offlineStorage.setCachedCourses(updated);
        return localCourse;
      }

      const res = await api.post<{ course: Course }>('/api/courses', input);
      return res.course;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSES_QUERY_KEY });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateCourseInput }) => {
      if (isOffline) {
        await offlineStorage.enqueueMutation('course', 'update', { id, ...input });
        await refreshQueueCount();

        const cached = await offlineStorage.getCachedCourses();
        const updated = cached.map((c) => (c.id === id ? { ...c, ...input } : c));
        await offlineStorage.setCachedCourses(updated);
        return { id, ...input } as Course;
      }

      const res = await api.put<{ course: Course }>(`/api/courses/${id}`, input);
      return res.course;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSES_QUERY_KEY });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isOffline) {
        await offlineStorage.enqueueMutation('course', 'delete', { id });
        await refreshQueueCount();

        const cached = await offlineStorage.getCachedCourses();
        const updated = cached.filter((c) => c.id !== id);
        await offlineStorage.setCachedCourses(updated);
        return { id };
      }

      await api.delete(`/api/courses/${id}`);
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['progressStats'] });
    },
  });

  return {
    courses: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createCourse: createCourseMutation.mutateAsync,
    updateCourse: updateCourseMutation.mutateAsync,
    deleteCourse: deleteCourseMutation.mutateAsync,
    isCreating: createCourseMutation.isPending,
  };
}
