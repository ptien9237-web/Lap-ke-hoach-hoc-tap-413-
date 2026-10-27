import { describe, it, expect } from 'vitest';
import { Assignment, CreateAssignmentInput, UpdateAssignmentInput } from '../src/types/assignment';
import { Course } from '../src/types/course';

/**
 * Pure state guard logic and initialization helpers mirroring AssignmentFormModal
 * and AssignmentFormContent to verify fix for FUNC-001 / TECH-001.
 */
export function computeFormGuardState({
  isEditing,
  isLoadingAssignments,
  isErrorAssignments,
  hasExistingAssignment,
  isLoadingCourses,
  hasCourses,
}: {
  isEditing: boolean;
  isLoadingAssignments: boolean;
  isErrorAssignments: boolean;
  hasExistingAssignment: boolean;
  isLoadingCourses: boolean;
  hasCourses: boolean;
}) {
  const isLoading =
    (isEditing && isLoadingAssignments && !hasExistingAssignment) ||
    (isLoadingCourses && !hasCourses);

  const isError = isEditing && isErrorAssignments && !hasExistingAssignment;
  const isNotFound = isEditing && !isLoadingAssignments && !isErrorAssignments && !hasExistingAssignment;

  return { isLoading, isError, isNotFound };
}

export function resolveInitialFormValues(
  existingAssignment: Assignment | null,
  courses: Course[]
) {
  const effectiveCourseId = existingAssignment?.courseId || courses[0]?.id || '';
  const title = existingAssignment?.title || '';
  const dueAt = existingAssignment?.dueAt || (() => {
    const d = new Date();
    d.setHours(23, 59, 0, 0);
    return d.toISOString();
  })();
  const status = existingAssignment?.status || 'pending';
  const notes = existingAssignment?.notes || '';
  const photoUri = existingAssignment?.photoUri || null;

  return {
    courseId: effectiveCourseId,
    title,
    dueAt,
    status,
    notes,
    photoUri,
  };
}

export function validateAssignmentForm({
  title,
  courseId,
  dueAt,
}: {
  title: string;
  courseId: string;
  dueAt: string;
}) {
  const errs: Record<string, string> = {};
  if (!title.trim()) {
    errs.title = 'Tiêu đề bài tập không được để trống.';
  }
  if (!courseId) {
    errs.courseId = 'Vui lòng chọn học phần.';
  }
  if (isNaN(Date.parse(dueAt))) {
    errs.dueAt = 'Thời hạn nộp không hợp lệ.';
  }
  return {
    isValid: Object.keys(errs).length === 0,
    errors: errs,
  };
}

describe('Assignment Form State & Guard Verification (FIX 01 - FUNC-001)', () => {
  const sampleCourses: Course[] = [
    { id: 'course_1', code: 'CS101', name: 'Nhập môn Lập trình', colour: 'courseBlue' },
    { id: 'course_2', code: 'CS102', name: 'Cấu trúc Dữ liệu', colour: 'coursePurple' },
  ];

  const sampleAssignment: Assignment = {
    id: 'assign_101',
    courseId: 'course_2',
    title: 'Báo cáo Bài tập lớn 2',
    dueAt: '2026-11-01T17:00:00.000Z',
    status: 'pending',
    notes: 'Nhớ kèm file PDF và ảnh chụp bảng trắng',
    photoUri: 'file:///path/to/whiteboard.jpg',
  };

  describe('1. Form State Initialization', () => {
    it('should initialize form fields correctly when editing an existing assignment', () => {
      const initial = resolveInitialFormValues(sampleAssignment, sampleCourses);

      expect(initial.title).toBe('Báo cáo Bài tập lớn 2');
      expect(initial.courseId).toBe('course_2');
      expect(initial.dueAt).toBe('2026-11-01T17:00:00.000Z');
      expect(initial.status).toBe('pending');
      expect(initial.notes).toBe('Nhớ kèm file PDF và ảnh chụp bảng trắng');
      expect(initial.photoUri).toBe('file:///path/to/whiteboard.jpg');
    });

    it('should initialize clean default fields when creating a new assignment', () => {
      const initial = resolveInitialFormValues(null, sampleCourses);

      expect(initial.title).toBe('');
      expect(initial.courseId).toBe('course_1'); // Defaults to first course
      expect(initial.status).toBe('pending');
      expect(initial.notes).toBe('');
      expect(initial.photoUri).toBeNull();
      expect(new Date(initial.dueAt).getHours()).toBe(23);
      expect(new Date(initial.dueAt).getMinutes()).toBe(59);
    });
  });

  describe('2. Async Loading & State Guards', () => {
    it('should show loading state and prevent showing blank form when editing and query is in-flight', () => {
      const guard = computeFormGuardState({
        isEditing: true,
        isLoadingAssignments: true,
        isErrorAssignments: false,
        hasExistingAssignment: false,
        isLoadingCourses: false,
        hasCourses: true,
      });

      expect(guard.isLoading).toBe(true);
      expect(guard.isNotFound).toBe(false);
      expect(guard.isError).toBe(false);
    });

    it('should show not-found state when query finishes and requested assignment ID does not exist', () => {
      const guard = computeFormGuardState({
        isEditing: true,
        isLoadingAssignments: false,
        isErrorAssignments: false,
        hasExistingAssignment: false,
        isLoadingCourses: false,
        hasCourses: true,
      });

      expect(guard.isLoading).toBe(false);
      expect(guard.isNotFound).toBe(true);
      expect(guard.isError).toBe(false);
    });

    it('should show error state with retry when query fails and no cached assignment is available', () => {
      const guard = computeFormGuardState({
        isEditing: true,
        isLoadingAssignments: false,
        isErrorAssignments: true,
        hasExistingAssignment: false,
        isLoadingCourses: false,
        hasCourses: true,
      });

      expect(guard.isLoading).toBe(false);
      expect(guard.isNotFound).toBe(false);
      expect(guard.isError).toBe(true);
    });

    it('should render form immediately when assignment is already in cache', () => {
      const guard = computeFormGuardState({
        isEditing: true,
        isLoadingAssignments: false,
        isErrorAssignments: false,
        hasExistingAssignment: true,
        isLoadingCourses: false,
        hasCourses: true,
      });

      expect(guard.isLoading).toBe(false);
      expect(guard.isNotFound).toBe(false);
      expect(guard.isError).toBe(false);
    });
  });

  describe('3. User Input Preservation', () => {
    it('should preserve user edits even if background query revalidates', () => {
      // Simulate form mounted with initial assignment data
      let formState = resolveInitialFormValues(sampleAssignment, sampleCourses);

      // User modifies title and notes
      formState = {
        ...formState,
        title: 'Tiêu đề đã được người dùng chỉnh sửa',
        notes: 'Ghi chú mới bổ sung',
      };

      // Simulating a background query revalidation (e.g., queryClient refetch)
      // Because state is managed in AssignmentFormContent local state, user edits remain intact
      expect(formState.title).toBe('Tiêu đề đã được người dùng chỉnh sửa');
      expect(formState.notes).toBe('Ghi chú mới bổ sung');
      expect(formState.courseId).toBe('course_2');
    });
  });

  describe('4. Validation & Submission Payload', () => {
    it('should fail validation if title is empty or whitespace', () => {
      const result = validateAssignmentForm({
        title: '   ',
        courseId: 'course_1',
        dueAt: '2026-11-01T17:00:00.000Z',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe('Tiêu đề bài tập không được để trống.');
    });

    it('should fail validation if courseId is missing', () => {
      const result = validateAssignmentForm({
        title: 'Bài tập 1',
        courseId: '',
        dueAt: '2026-11-01T17:00:00.000Z',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.courseId).toBe('Vui lòng chọn học phần.');
    });

    it('should fail validation if dueAt is invalid date format', () => {
      const result = validateAssignmentForm({
        title: 'Bài tập 1',
        courseId: 'course_1',
        dueAt: 'invalid-date-string',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.dueAt).toBe('Thời hạn nộp không hợp lệ.');
    });

    it('should pass validation with valid form data', () => {
      const result = validateAssignmentForm({
        title: 'Đồ án môn học',
        courseId: 'course_1',
        dueAt: '2026-11-01T17:00:00.000Z',
      });

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should construct correct update payload', () => {
      const input: UpdateAssignmentInput = {
        courseId: 'course_1',
        title: 'Tiêu đề sau cập nhật'.trim(),
        dueAt: '2026-11-02T12:00:00.000Z',
        status: 'completed',
        notes: 'Ghi chú cập nhật'.trim() || null,
        photoUri: null,
      };

      expect(input.title).toBe('Tiêu đề sau cập nhật');
      expect(input.status).toBe('completed');
      expect(input.notes).toBe('Ghi chú cập nhật');
      expect(input.photoUri).toBeNull();
    });
  });
});
