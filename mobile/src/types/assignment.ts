export type AssignmentStatus = 'pending' | 'completed';

export interface Assignment {
  id: string;
  userId?: string;
  courseId: string;
  title: string;
  dueAt: string; // ISO 8601 string
  status: AssignmentStatus;
  notes?: string | null;
  photoUri?: string | null;
  createdAt?: string;
  updatedAt?: string;

  // Joined course fields
  courseCode?: string;
  courseName?: string;
  courseColour?: string;

  // Client-side local flags
  isLocalOnly?: boolean;
  isSyncing?: boolean;
}

export interface CreateAssignmentInput {
  id?: string;
  courseId: string;
  title: string;
  dueAt: string;
  status?: AssignmentStatus;
  notes?: string | null;
  photoUri?: string | null;
}

export interface UpdateAssignmentInput {
  courseId?: string;
  title?: string;
  dueAt?: string;
  status?: AssignmentStatus;
  notes?: string | null;
  photoUri?: string | null;
}

export interface AssignmentFilterOptions {
  courseId?: string;
  status?: 'all' | 'pending' | 'completed';
  search?: string;
  sort?: 'dueAsc' | 'dueDesc' | 'createdDesc';
}
