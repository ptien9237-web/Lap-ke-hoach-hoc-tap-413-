import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import { ProgressStatsResponseData, CourseProgressStat } from '../types/stats';

export const PROGRESS_STATS_QUERY_KEY = ['progressStats'];

export function useProgressStats() {
  const query = useQuery({
    queryKey: PROGRESS_STATS_QUERY_KEY,
    queryFn: async (): Promise<ProgressStatsResponseData> => {
      try {
        const res = await api.get<ProgressStatsResponseData>('/api/stats/progress');
        return res;
      } catch {
        // Compute dynamically on client from local cached assignments and courses
        const cachedCourses = await offlineStorage.getCachedCourses();
        const cachedAssignments = await offlineStorage.getCachedAssignments();

        let totalAll = 0;
        let completedAll = 0;
        let pendingAll = 0;

        const coursesStats: CourseProgressStat[] = cachedCourses.map((c) => {
          const courseAssignments = cachedAssignments.filter((a) => a.courseId === c.id);
          const total = courseAssignments.length;
          const completed = courseAssignments.filter((a) => a.status === 'completed').length;
          const pending = total - completed;
          const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

          totalAll += total;
          completedAll += completed;
          pendingAll += pending;

          return {
            courseId: c.id,
            courseCode: c.code,
            courseName: c.name,
            courseColour: c.colour,
            total,
            completed,
            pending,
            completionRate: rate,
          };
        });

        const overallRate = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;

        return {
          overview: {
            totalAssignments: totalAll,
            completedAssignments: completedAll,
            pendingAssignments: pendingAll,
            completionRate: overallRate,
            dueSoonCount: 0,
          },
          courses: coursesStats,
        };
      }
    },
    staleTime: 1000 * 60 * 2,
  });

  return {
    overview: query.data?.overview || {
      totalAssignments: 0,
      completedAssignments: 0,
      pendingAssignments: 0,
      completionRate: 0,
      dueSoonCount: 0,
    },
    courses: query.data?.courses || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
