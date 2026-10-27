export interface CourseProgressStat {
  courseId: string;
  courseCode: string;
  courseName: string;
  courseColour: string;
  total: number;
  completed: number;
  pending: number;
  completionRate: number; // 0 - 100
}

export interface ProgressOverview {
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  completionRate: number; // 0 - 100
  dueSoonCount: number; // pending within next 48 hours
}

export interface ProgressStatsResponseData {
  overview: ProgressOverview;
  courses: CourseProgressStat[];
}
