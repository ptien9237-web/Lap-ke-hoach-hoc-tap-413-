import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import { notificationService } from '../services/notifications';
import { useOfflineStore } from '../stores/offlineStore';
import {
  Assignment,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  AssignmentFilterOptions,
} from '../types/assignment';

export const ASSIGNMENTS_QUERY_KEY = ['assignments'];

export function useAssignments(filters?: AssignmentFilterOptions) {
  const queryClient = useQueryClient();
  const isOffline = useOfflineStore((s) => s.isOffline);
  const refreshQueueCount = useOfflineStore((s) => s.refreshQueueCount);

  // Extract server-side query filters to avoid refetching on client-side search keystrokes
  const serverFilters = {
    courseId: filters?.courseId && filters.courseId !== 'all' ? filters.courseId : undefined,
    status: filters?.status && filters.status !== 'all' ? filters.status : undefined,
    sort: filters?.sort,
  };

  const query = useQuery({
    queryKey: [...ASSIGNMENTS_QUERY_KEY, serverFilters],
    queryFn: async () => {
      try {
        const params: Record<string, any> = {};
        if (serverFilters.courseId) params.courseId = serverFilters.courseId;
        if (serverFilters.status) params.status = serverFilters.status;
        if (serverFilters.sort) params.sort = serverFilters.sort;

        const res = await api.get<{ assignments: Assignment[] }>('/api/assignments', { params });
        // Update local persistent cache
        await offlineStorage.setCachedAssignments(res.assignments);
        return res.assignments;
      } catch (err: any) {
        // Fallback to local cache if network fails
        const cached = await offlineStorage.getCachedAssignments();
        if (cached.length > 0) {
          useOfflineStore.getState().setIsOffline(true);
          let filtered = cached;

          if (serverFilters.courseId) {
            filtered = filtered.filter((a) => a.courseId === serverFilters.courseId);
          }
          if (serverFilters.status) {
            filtered = filtered.filter((a) => a.status === serverFilters.status);
          }

          return filtered;
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const searchQuery = filters?.search;
  const assignmentsData = query.data;

  // Client-side search filtering memoized so typing never hits the network
  const filteredAssignments = useMemo(() => {
    const list = assignmentsData || [];
    if (!searchQuery || !searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((assignment) =>
      assignment.title.toLowerCase().includes(q) ||
      (assignment.notes && assignment.notes.toLowerCase().includes(q)) ||
      (assignment.courseCode && assignment.courseCode.toLowerCase().includes(q))
    );
  }, [assignmentsData, searchQuery]);

  const createAssignmentMutation = useMutation({
    mutationFn: async (input: CreateAssignmentInput) => {
      const clientId = input.id || `local_assign_${Date.now()}`;
      const payload = { ...input, id: clientId };

      if (isOffline) {
        const localAssignment: Assignment = {
          id: clientId,
          courseId: input.courseId,
          title: input.title,
          dueAt: input.dueAt,
          status: input.status || 'pending',
          notes: input.notes,
          photoUri: input.photoUri,
          createdAt: new Date().toISOString(),
          isLocalOnly: true,
        };

        await offlineStorage.enqueueMutation('assignment', 'create', payload);
        await refreshQueueCount();

        // Optimistically cache locally
        const cached = await offlineStorage.getCachedAssignments();
        await offlineStorage.setCachedAssignments([localAssignment, ...cached]);

        // Schedule notification
        await notificationService.scheduleAssignmentReminder(localAssignment);

        return localAssignment;
      }

      const res = await api.post<{ assignment: Assignment }>('/api/assignments', payload);
      await notificationService.scheduleAssignmentReminder(res.assignment);
      return res.assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['progressStats'] });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateAssignmentInput }) => {
      if (isOffline) {
        await offlineStorage.enqueueMutation('assignment', 'update', { id, ...input });
        await refreshQueueCount();

        const cached = await offlineStorage.getCachedAssignments();
        const updated = cached.map((a) => (a.id === id ? { ...a, ...input } : a));
        await offlineStorage.setCachedAssignments(updated);

        const target = updated.find((a) => a.id === id);
        if (target) {
          await notificationService.scheduleAssignmentReminder(target);
        }
        return target || ({ id, ...input } as Assignment);
      }

      const res = await api.put<{ assignment: Assignment }>(`/api/assignments/${id}`, input);
      await notificationService.scheduleAssignmentReminder(res.assignment);
      return res.assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['progressStats'] });
    },
  });

  // OPTIMISTIC UPDATE for toggling status (completed <-> pending)
  const toggleAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isOffline) {
        const cached = await offlineStorage.getCachedAssignments();
        const existing = cached.find((a) => a.id === id);
        const newStatus = existing?.status === 'completed' ? 'pending' : 'completed';

        await offlineStorage.enqueueMutation('assignment', 'toggle', { id, status: newStatus });
        await refreshQueueCount();

        const updated = cached.map((a) =>
          a.id === id ? { ...a, status: newStatus as any } : a
        );
        await offlineStorage.setCachedAssignments(updated);

        const target = updated.find((a) => a.id === id);
        if (target) {
          if (target.status === 'completed') {
            await notificationService.cancelAssignmentReminder(id);
          } else {
            await notificationService.scheduleAssignmentReminder(target);
          }
        }
        return target;
      }

      const res = await api.patch<{ assignment: Assignment }>(`/api/assignments/${id}/toggle`);
      if (res.assignment.status === 'completed') {
        await notificationService.cancelAssignmentReminder(id);
      } else {
        await notificationService.scheduleAssignmentReminder(res.assignment);
      }
      return res.assignment;
    },
    onMutate: async (id: string) => {
      // Cancel queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });

      // Snapshot previous assignments
      const previousAssignments = queryClient.getQueryData<Assignment[]>(ASSIGNMENTS_QUERY_KEY);

      // Optimistically flip status in React Query cache
      queryClient.setQueryData<Assignment[]>(ASSIGNMENTS_QUERY_KEY, (old) => {
        if (!old) return [];
        return old.map((a) =>
          a.id === id ? { ...a, status: a.status === 'completed' ? 'pending' : 'completed' } : a
        );
      });

      return { previousAssignments };
    },
    onError: (err, id, context) => {
      // Rollback to previous state if server rejected
      if (context?.previousAssignments) {
        queryClient.setQueryData(ASSIGNMENTS_QUERY_KEY, context.previousAssignments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['progressStats'] });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      await notificationService.cancelAssignmentReminder(id);

      if (isOffline) {
        await offlineStorage.enqueueMutation('assignment', 'delete', { id });
        await refreshQueueCount();

        const cached = await offlineStorage.getCachedAssignments();
        const updated = cached.filter((a) => a.id !== id);
        await offlineStorage.setCachedAssignments(updated);
        return { id };
      }

      await api.delete(`/api/assignments/${id}`);
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['progressStats'] });
    },
  });

  return {
    assignments: filteredAssignments,
    allAssignments: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createAssignment: createAssignmentMutation.mutateAsync,
    updateAssignment: updateAssignmentMutation.mutateAsync,
    toggleAssignment: toggleAssignmentMutation.mutateAsync,
    deleteAssignment: deleteAssignmentMutation.mutateAsync,
    isCreating: createAssignmentMutation.isPending,
  };
}

/**
 * Hook to fetch a single assignment by ID.
 * - Supports instant rendering via initialData from cache if assignment is already loaded.
 * - Calls GET /api/assignments/:id if accessing directly via deep link, web refresh, or empty cache.
 * - Handles offline fallback safely.
 */
export function useAssignment(id?: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [...ASSIGNMENTS_QUERY_KEY, 'detail', id],
    queryFn: async () => {
      if (!id) return null;

      try {
        const res = await api.get<{ assignment: Assignment }>(`/api/assignments/${id}`);
        return res.assignment;
      } catch (err: any) {
        // Fallback to local cache if network fails
        const cached = await offlineStorage.getCachedAssignments();
        const found = cached.find((a) => a.id === id);
        if (found) {
          useOfflineStore.getState().setIsOffline(true);
          return found;
        }
        throw err;
      }
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2, // 2 minutes
    initialData: () => {
      if (!id) return undefined;
      const cachedList = queryClient.getQueryData<Assignment[]>(ASSIGNMENTS_QUERY_KEY);
      return cachedList?.find((a) => a.id === id);
    },
  });
}
