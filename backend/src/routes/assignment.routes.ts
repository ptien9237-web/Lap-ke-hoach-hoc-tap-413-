import { Router, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { getDatabase } from '../db/database';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';

export const assignmentRouter = Router();

// Apply auth to all assignment routes
assignmentRouter.use(authMiddleware);

const assignmentCreateSchema = z.object({
  id: z.string().optional(),
  courseId: z.string().min(1, 'Học phần không được để trống'),
  title: z.string().min(1, 'Tiêu đề bài tập không được để trống').max(200),
  dueAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Hạn nộp phải là định dạng thời gian ISO 8601 hợp lệ',
  }),
  status: z.enum(['pending', 'completed']).optional().default('pending'),
  notes: z.string().optional().nullable(),
  photoUri: z.string().optional().nullable(),
});

const assignmentUpdateSchema = z.object({
  courseId: z.string().min(1, 'Học phần không được để trống').optional(),
  title: z.string().min(1, 'Tiêu đề bài tập không được để trống').max(200).optional(),
  dueAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Hạn nộp phải là định dạng thời gian ISO 8601 hợp lệ',
  }).optional(),
  status: z.enum(['pending', 'completed']).optional(),
  notes: z.string().optional().nullable(),
  photoUri: z.string().optional().nullable(),
});

const assignmentFilterSchema = z.object({
  courseId: z.string().optional(),
  status: z.enum(['pending', 'completed', 'all']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  sort: z.enum(['dueAsc', 'dueDesc', 'createdDesc']).optional().default('dueAsc'),
});

// GET all assignments with course info
assignmentRouter.get('/', validateQuery(assignmentFilterSchema), (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const userId = req.userId!;
  const { courseId, status, from, to, sort } = req.query as {
    courseId?: string;
    status?: string;
    from?: string;
    to?: string;
    sort?: string;
  };

  let query = `
    SELECT 
      a.id, a.user_id as userId, a.course_id as courseId, a.title, 
      a.due_at as dueAt, a.status, a.notes, a.photo_uri as photoUri,
      a.created_at as createdAt, a.updated_at as updatedAt,
      c.code as courseCode, c.name as courseName, c.colour as courseColour
    FROM assignments a
    JOIN courses c ON a.course_id = c.id
    WHERE a.user_id = ?
  `;
  const params: any[] = [userId];

  if (courseId) {
    query += ' AND a.course_id = ?';
    params.push(courseId);
  }

  if (status && status !== 'all') {
    query += ' AND a.status = ?';
    params.push(status);
  }

  if (from) {
    query += ' AND a.due_at >= ?';
    params.push(from);
  }

  if (to) {
    query += ' AND a.due_at <= ?';
    params.push(to);
  }

  if (sort === 'dueDesc') {
    query += ' ORDER BY a.due_at DESC';
  } else if (sort === 'createdDesc') {
    query += ' ORDER BY a.created_at DESC';
  } else {
    query += ' ORDER BY a.due_at ASC';
  }

  const assignments = db.prepare(query).all(...params);

  res.json({
    success: true,
    data: { assignments },
  });
});

// GET assignment by ID
assignmentRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const userId = req.userId!;

  const assignment = db.prepare(`
    SELECT 
      a.id, a.user_id as userId, a.course_id as courseId, a.title, 
      a.due_at as dueAt, a.status, a.notes, a.photo_uri as photoUri,
      a.created_at as createdAt, a.updated_at as updatedAt,
      c.code as courseCode, c.name as courseName, c.colour as courseColour
    FROM assignments a
    JOIN courses c ON a.course_id = c.id
    WHERE a.id = ? AND a.user_id = ?
  `).get(id, userId);

  if (!assignment) {
    res.status(404).json({
      success: false,
      error: {
        code: 'ASSIGNMENT_NOT_FOUND',
        message: 'Không tìm thấy bài tập hoặc bạn không có quyền truy cập.',
      },
    });
    return;
  }

  res.json({
    success: true,
    data: { assignment },
  });
});

// CREATE assignment
assignmentRouter.post('/', validateBody(assignmentCreateSchema), (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId, courseId, title, dueAt, status, notes, photoUri } = req.body;
  const db = getDatabase();
  const userId = req.userId!;

  // Verify course belongs to this user
  const course = db.prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?').get(courseId, userId);
  if (!course) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_COURSE',
        message: 'Học phần được chọn không tồn tại hoặc không thuộc tài khoản của bạn.',
      },
    });
    return;
  }

  const assignmentId = clientId || crypto.randomUUID();

  // Check if ID already exists (idempotency from offline sync)
  const existing = db.prepare('SELECT id FROM assignments WHERE id = ? AND user_id = ?').get(assignmentId, userId);
  if (existing) {
    // Return existing assignment instead of failing
    const existingAssignment = db.prepare(`
      SELECT 
        a.id, a.user_id as userId, a.course_id as courseId, a.title, 
        a.due_at as dueAt, a.status, a.notes, a.photo_uri as photoUri,
        a.created_at as createdAt, a.updated_at as updatedAt,
        c.code as courseCode, c.name as courseName, c.colour as courseColour
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = ?
    `).get(assignmentId);

    res.status(200).json({
      success: true,
      data: { assignment: existingAssignment },
    });
    return;
  }

  db.prepare(`
    INSERT INTO assignments (id, user_id, course_id, title, due_at, status, notes, photo_uri)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    assignmentId,
    userId,
    courseId,
    title.trim(),
    dueAt,
    status || 'pending',
    notes ? notes.trim() : null,
    photoUri || null
  );

  const createdAssignment = db.prepare(`
    SELECT 
      a.id, a.user_id as userId, a.course_id as courseId, a.title, 
      a.due_at as dueAt, a.status, a.notes, a.photo_uri as photoUri,
      a.created_at as createdAt, a.updated_at as updatedAt,
      c.code as courseCode, c.name as courseName, c.colour as courseColour
    FROM assignments a
    JOIN courses c ON a.course_id = c.id
    WHERE a.id = ?
  `).get(assignmentId);

  res.status(201).json({
    success: true,
    data: { assignment: createdAssignment },
  });
});

// UPDATE assignment
assignmentRouter.put('/:id', validateBody(assignmentUpdateSchema), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { courseId, title, dueAt, status, notes, photoUri } = req.body;
  const db = getDatabase();
  const userId = req.userId!;

  const existing = db.prepare('SELECT * FROM assignments WHERE id = ? AND user_id = ?').get(id, userId) as any;
  if (!existing) {
    res.status(404).json({
      success: false,
      error: {
        code: 'ASSIGNMENT_NOT_FOUND',
        message: 'Bài tập không tồn tại hoặc bạn không có quyền chỉnh sửa.',
      },
    });
    return;
  }

  // If courseId changed, verify new course belongs to user
  if (courseId && courseId !== existing.course_id) {
    const course = db.prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?').get(courseId, userId);
    if (!course) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COURSE',
          message: 'Học phần được chọn không hợp lệ.',
        },
      });
      return;
    }
  }

  const updatedCourseId = courseId !== undefined ? courseId : existing.course_id;
  const updatedTitle = title !== undefined ? title.trim() : existing.title;
  const updatedDueAt = dueAt !== undefined ? dueAt : existing.due_at;
  const updatedStatus = status !== undefined ? status : existing.status;
  const updatedNotes = notes !== undefined ? (notes ? notes.trim() : null) : existing.notes;
  const updatedPhotoUri = photoUri !== undefined ? photoUri : existing.photo_uri;

  db.prepare(`
    UPDATE assignments
    SET course_id = ?, title = ?, due_at = ?, status = ?, notes = ?, photo_uri = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(updatedCourseId, updatedTitle, updatedDueAt, updatedStatus, updatedNotes, updatedPhotoUri, id, userId);

  const updatedAssignment = db.prepare(`
    SELECT 
      a.id, a.user_id as userId, a.course_id as courseId, a.title, 
      a.due_at as dueAt, a.status, a.notes, a.photo_uri as photoUri,
      a.created_at as createdAt, a.updated_at as updatedAt,
      c.code as courseCode, c.name as courseName, c.colour as courseColour
    FROM assignments a
    JOIN courses c ON a.course_id = c.id
    WHERE a.id = ?
  `).get(id);

  res.json({
    success: true,
    data: { assignment: updatedAssignment },
  });
});

// TOGGLE assignment status
assignmentRouter.patch('/:id/toggle', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const userId = req.userId!;

  const existing = db.prepare('SELECT status FROM assignments WHERE id = ? AND user_id = ?').get(id, userId) as { status: string } | undefined;
  if (!existing) {
    res.status(404).json({
      success: false,
      error: {
        code: 'ASSIGNMENT_NOT_FOUND',
        message: 'Bài tập không tồn tại hoặc bạn không có quyền thao tác.',
      },
    });
    return;
  }

  const newStatus = existing.status === 'completed' ? 'pending' : 'completed';

  db.prepare(`
    UPDATE assignments
    SET status = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(newStatus, id, userId);

  const updated = db.prepare(`
    SELECT 
      a.id, a.user_id as userId, a.course_id as courseId, a.title, 
      a.due_at as dueAt, a.status, a.notes, a.photo_uri as photoUri,
      a.created_at as createdAt, a.updated_at as updatedAt,
      c.code as courseCode, c.name as courseName, c.colour as courseColour
    FROM assignments a
    JOIN courses c ON a.course_id = c.id
    WHERE a.id = ?
  `).get(id);

  res.json({
    success: true,
    data: { assignment: updated },
  });
});

// DELETE assignment
assignmentRouter.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const userId = req.userId!;

  const existing = db.prepare('SELECT id FROM assignments WHERE id = ? AND user_id = ?').get(id, userId);
  if (!existing) {
    res.status(404).json({
      success: false,
      error: {
        code: 'ASSIGNMENT_NOT_FOUND',
        message: 'Bài tập không tồn tại hoặc bạn không có quyền xóa.',
      },
    });
    return;
  }

  db.prepare('DELETE FROM assignments WHERE id = ? AND user_id = ?').run(id, userId);

  res.json({
    success: true,
    data: { message: 'Đã xóa bài tập thành công.' },
  });
});
