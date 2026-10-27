import { describe, it, expect } from 'vitest';
import { Assignment, AssignmentFilterOptions } from '../src/types/assignment';

export function filterAssignmentsClientSide(
  assignments: Assignment[],
  searchQuery?: string
): Assignment[] {
  if (!searchQuery || !searchQuery.trim()) return assignments;
  const q = searchQuery.toLowerCase().trim();
  return assignments.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      (a.notes && a.notes.toLowerCase().includes(q)) ||
      (a.courseCode && a.courseCode.toLowerCase().includes(q))
  );
}

export function extractServerFilters(filters?: AssignmentFilterOptions) {
  return {
    courseId: filters?.courseId && filters.courseId !== 'all' ? filters.courseId : undefined,
    status: filters?.status && filters.status !== 'all' ? filters.status : undefined,
    sort: filters?.sort,
  };
}

describe('Assignment Search Optimization & Client Filtering (FIX 03 - PERF-001)', () => {
  const mockAssignments: Assignment[] = [
    {
      id: 'a1',
      courseId: 'c1',
      courseCode: 'CS101',
      title: 'Báo cáo Giữa kỳ React Native',
      dueAt: '2026-11-01T17:00:00Z',
      status: 'pending',
      notes: 'Đọc tài liệu về hooks và state',
    },
    {
      id: 'a2',
      courseId: 'c1',
      courseCode: 'CS101',
      title: 'Bài tập lớn Mobile App',
      dueAt: '2026-11-05T23:59:00Z',
      status: 'completed',
      notes: 'Nộp file zip mã nguồn và báo cáo',
    },
    {
      id: 'a3',
      courseId: 'c2',
      courseCode: 'MATH202',
      title: 'Đề cương Ôn thi Xác suất',
      dueAt: '2026-11-10T12:00:00Z',
      status: 'pending',
      notes: 'Làm bài tập chương 3 và 4',
    },
  ];

  describe('1. Client-side Search Matching', () => {
    it('should return all assignments when search query is empty or undefined', () => {
      expect(filterAssignmentsClientSide(mockAssignments, '')).toHaveLength(3);
      expect(filterAssignmentsClientSide(mockAssignments, '   ')).toHaveLength(3);
      expect(filterAssignmentsClientSide(mockAssignments, undefined)).toHaveLength(3);
    });

    it('should find assignments by title (case-insensitive)', () => {
      const results = filterAssignmentsClientSide(mockAssignments, 'Giữa kỳ');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('a1');
    });

    it('should find assignments by notes content', () => {
      const results = filterAssignmentsClientSide(mockAssignments, 'file zip');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('a2');
    });

    it('should find assignments by course code', () => {
      const results = filterAssignmentsClientSide(mockAssignments, 'math202');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('a3');
    });

    it('should return empty array when no assignments match search query', () => {
      const results = filterAssignmentsClientSide(mockAssignments, 'không có từ khóa này');
      expect(results).toHaveLength(0);
    });
  });

  describe('2. QueryKey Stability (Zero Network Spam on Keystrokes)', () => {
    it('should produce identical serverFilters regardless of search input changes', () => {
      const baseFilters: AssignmentFilterOptions = {
        courseId: 'c1',
        status: 'pending',
        sort: 'dueAsc',
      };

      const keyEmpty = extractServerFilters({ ...baseFilters, search: '' });
      const keyChar1 = extractServerFilters({ ...baseFilters, search: 'b' });
      const keyChar2 = extractServerFilters({ ...baseFilters, search: 'báo' });
      const keyChar3 = extractServerFilters({ ...baseFilters, search: 'báo cáo giữa kỳ' });

      // Search keystrokes do NOT modify serverFilters -> queryKey stays completely unchanged
      expect(keyEmpty).toEqual(keyChar1);
      expect(keyChar1).toEqual(keyChar2);
      expect(keyChar2).toEqual(keyChar3);
    });

    it('should only update serverFilters when real server query params change', () => {
      const f1 = extractServerFilters({ courseId: 'c1', status: 'all', sort: 'dueAsc' });
      const f2 = extractServerFilters({ courseId: 'c2', status: 'all', sort: 'dueAsc' });
      const f3 = extractServerFilters({ courseId: 'c2', status: 'completed', sort: 'dueAsc' });

      expect(f1).not.toEqual(f2);
      expect(f2).not.toEqual(f3);
    });
  });
});
