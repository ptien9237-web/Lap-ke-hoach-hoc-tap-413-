import { Router, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { getDatabase } from '../db/database';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

export const courseRouter = Router();

// Apply auth to all course routes
courseRouter.use(authMiddleware);

const courseSchema = z.object({
  code: z.string().min(1, 'Mã học phần không được để trống').max(20),
  name: z.string().min(1, 'Tên học phần không được để trống').max(150),
  colour: z.string().min(1, 'Màu học phần không được để trống').max(50),
});

// GET all courses of authenticated user
courseRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const userId = req.userId!;

  const courses = db.prepare(`
    SELECT id, code, name, colour, created_at, updated_at
    FROM courses
    WHERE user_id = ?
    ORDER BY code ASC
  `).all(userId);

  res.json({
    success: true,
    data: { courses },
  });
});

// CREATE course
courseRouter.post('/', validateBody(courseSchema), (req: AuthenticatedRequest, res: Response) => {
  const { code, name, colour } = req.body;
  const db = getDatabase();
  const userId = req.userId!;
  const courseId = crypto.randomUUID();

  db.prepare(`
    INSERT INTO courses (id, user_id, code, name, colour)
    VALUES (?, ?, ?, ?, ?)
  `).run(courseId, userId, code.trim(), name.trim(), colour.trim());

  const newCourse = db.prepare(`
    SELECT id, code, name, colour, created_at, updated_at
    FROM courses
    WHERE id = ?
  `).get(courseId);

  res.status(201).json({
    success: true,
    data: { course: newCourse },
  });
});

// UPDATE course
courseRouter.put('/:id', validateBody(courseSchema), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { code, name, colour } = req.body;
  const db = getDatabase();
  const userId = req.userId!;

  // Verify ownership
  const existing = db.prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?').get(id, userId);
  if (!existing) {
    res.status(404).json({
      success: false,
      error: {
        code: 'COURSE_NOT_FOUND',
        message: 'Học phần không tồn tại hoặc bạn không có quyền chỉnh sửa.',
      },
    });
    return;
  }

  db.prepare(`
    UPDATE courses
    SET code = ?, name = ?, colour = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(code.trim(), name.trim(), colour.trim(), id, userId);

  const updatedCourse = db.prepare(`
    SELECT id, code, name, colour, created_at, updated_at
    FROM courses
    WHERE id = ?
  `).get(id);

  res.json({
    success: true,
    data: { course: updatedCourse },
  });
});

// DELETE course
courseRouter.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const userId = req.userId!;

  // Verify ownership
  const existing = db.prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?').get(id, userId);
  if (!existing) {
    res.status(404).json({
      success: false,
      error: {
        code: 'COURSE_NOT_FOUND',
        message: 'Học phần không tồn tại hoặc bạn không có quyền xóa.',
      },
    });
    return;
  }

  // Delete course (foreign key cascade deletes assignments)
  db.prepare('DELETE FROM courses WHERE id = ? AND user_id = ?').run(id, userId);

  res.json({
    success: true,
    data: { message: 'Đã xóa học phần và các bài tập liên quan thành công.' },
  });
});
