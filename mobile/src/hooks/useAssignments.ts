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

  const query = useQuery({
    queryKey: [...ASSIGNMENTS_QUERY_KEY, filters],
    queryFn: async () => {
      try {
        const params: Record<string, any> = {};
        if (filters?.courseId && filters.courseId !== 'all') params.courseId = filters.courseId;
        if (filters?.status && filters.status !== 'all') params.status = filters.status;
        if (filters?.sort) params.sort = filters.sort;

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

          if (filters?.courseId && filters.courseId !== 'all') {
            filtered = filtered.filter((a) => a.courseId === filters.courseId);
          }
          if (filters?.status && filters.status !== 'all') {
            filtered = filtered.filter((a) => a.status === filters.status);
          }
          if (filters?.search && filters.search.trim()) {
            const q = filters.search.toLowerCase();
            filtered = filtered.filter((a) => a.title.toLowerCase().includes(q) || (a.notes && a.notes.toLowerCase().includes(q)));
          }

          return filtered;
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Client-side search filtering if query returns full set
  const filteredAssignments = (query.data || []).filter((assignment) => {
    if (!filters?.search || !filters.search.trim()) return true;
    const q = filters.search.toLowerCase();
    return (
      assignment.title.toLowerCase().includes(q) ||
      (assignment.notes && assignment.notes.toLowerCase().includes(q)) ||
      (assignment.courseCode && assignment.courseCode.toLowerCase().includes(q))
    );
  });

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
