import { describe, it, expect } from 'vitest';
import { Course } from '../src/types/course';
import { Assignment } from '../src/types/assignment';

// Pure logic function representing dynamic stats calculation
function computeProgressStats(courses: Course[], assignments: Assignment[]) {
  let totalAll = 0;
  let completedAll = 0;
  let pendingAll = 0;

  const courseStats = courses.map((c) => {
    const courseAssignments = assignments.filter((a) => a.courseId === c.id);
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
    },
    courses: courseStats,
  };
}

describe('Dynamic Progress Statistics Computation (Requirement 5.6 & 10)', () => {
  const sampleCourses: Course[] = [
    { id: 'c1', code: 'INT3102', name: 'Lập trình Mobile', colour: 'courseBlue' },
    { id: 'c2', code: 'INT3110', name: 'Kiến trúc phần mềm', colour: 'courseEmerald' },
    { id: 'c3', code: 'EMPTY101', name: 'Học phần chưa có bài', colour: 'courseRose' },
  ];

  const sampleAssignments: Assignment[] = [
    { id: 'a1', courseId: 'c1', title: 'Task 1', dueAt: '2026-10-28T23:59:00', status: 'completed' },
    { id: 'a2', courseId: 'c1', title: 'Task 2', dueAt: '2026-10-29T23:59:00', status: 'pending' },
    { id: 'a3', courseId: 'c2', title: 'Task 3', dueAt: '2026-10-30T23:59:00', status: 'completed' },
    { id: 'a4', courseId: 'c2', title: 'Task 4', dueAt: '2026-10-31T23:59:00', status: 'completed' },
  ];

  it('should accurately compute overall completion stats', () => {
    const result = computeProgressStats(sampleCourses, sampleAssignments);

    expect(result.overview.totalAssignments).toBe(4);
    expect(result.overview.completedAssignments).toBe(3);
    expect(result.overview.pendingAssignments).toBe(1);
    expect(result.overview.completionRate).toBe(75); // 3/4 = 75%
  });

  it('should safely handle courses with 0 assignments without NaN', () => {
    const result = computeProgressStats(sampleCourses, sampleAssignments);
    const emptyStat = result.courses.find((c) => c.courseCode === 'EMPTY101');

    expect(emptyStat).toBeDefined();
    expect(emptyStat?.total).toBe(0);
    expect(emptyStat?.completed).toBe(0);
    expect(emptyStat?.pending).toBe(0);
    expect(emptyStat?.completionRate).toBe(0);
    expect(isNaN(emptyStat?.completionRate || 0)).toBe(false);
  });

  it('should compute individual course progress accurately', () => {
    const result = computeProgressStats(sampleCourses, sampleAssignments);
    const c1Stat = result.courses.find((c) => c.courseCode === 'INT3102');
    const c2Stat = result.courses.find((c) => c.courseCode === 'INT3110');

    expect(c1Stat?.total).toBe(2);
    expect(c1Stat?.completed).toBe(1);
    expect(c1Stat?.pending).toBe(1);
    expect(c1Stat?.completionRate).toBe(50);

    expect(c2Stat?.total).toBe(2);
    expect(c2Stat?.completed).toBe(2);
    expect(c2Stat?.pending).toBe(0);
    expect(c2Stat?.completionRate).toBe(100);
  });

  it('should immediately update rates when an assignment status flips', () => {
    const updatedAssignments: Assignment[] = sampleAssignments.map((a) =>
      a.id === 'a2' ? { ...a, status: 'completed' } : a
    );
    const result = computeProgressStats(sampleCourses, updatedAssignments);

    expect(result.overview.completedAssignments).toBe(4);
    expect(result.overview.pendingAssignments).toBe(0);
    expect(result.overview.completionRate).toBe(100);

    const c1Stat = result.courses.find((c) => c.courseCode === 'INT3102');
    expect(c1Stat?.completionRate).toBe(100);
  });
});
