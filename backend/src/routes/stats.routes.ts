import { Router, Response } from 'express';
import { getDatabase } from '../db/database';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

export const statsRouter = Router();

statsRouter.use(authMiddleware);

// GET progress statistics dynamically computed from real assignments
statsRouter.get('/progress', (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const userId = req.userId!;

  // 1. Fetch all user courses
  const courses = db.prepare(`
    SELECT id, code, name, colour
    FROM courses
    WHERE user_id = ?
    ORDER BY code ASC
  `).all(userId) as Array<{ id: string; code: string; name: string; colour: string }>;

  // 2. Fetch assignment counts per course
  const statsRows = db.prepare(`
    SELECT 
      course_id,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM assignments
    WHERE user_id = ?
    GROUP BY course_id
  `).all(userId) as Array<{
    course_id: string;
    total: number;
    completed: number;
    pending: number;
  }>;

  const statsMap = new Map<string, { total: number; completed: number; pending: number }>();
  for (const row of statsRows) {
    statsMap.set(row.course_id, {
      total: Number(row.total || 0),
      completed: Number(row.completed || 0),
      pending: Number(row.pending || 0),
    });
  }

  let overallTotal = 0;
  let overallCompleted = 0;
  let overallPending = 0;

  const courseStats = courses.map((c) => {
    const data = statsMap.get(c.id) || { total: 0, completed: 0, pending: 0 };
    overallTotal += data.total;
    overallCompleted += data.completed;
    overallPending += data.pending;

    const rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

    return {
      courseId: c.id,
      courseCode: c.code,
      courseName: c.name,
      courseColour: c.colour,
      total: data.total,
      completed: data.completed,
      pending: data.pending,
      completionRate: rate,
    };
  });

  const overallRate = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  // Next 48h pending assignments count
  const nowIso = new Date().toISOString();
  const next48hIso = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const dueSoonRow = db.prepare(`
    SELECT COUNT(*) as dueSoonCount
    FROM assignments
    WHERE user_id = ? AND status = 'pending' AND due_at >= ? AND due_at <= ?
  `).get(userId, nowIso, next48hIso) as { dueSoonCount: number } | undefined;

  const dueSoonCount = Number(dueSoonRow?.dueSoonCount || 0);

  res.json({
    success: true,
    data: {
      overview: {
        totalAssignments: overallTotal,
        completedAssignments: overallCompleted,
        pendingAssignments: overallPending,
        completionRate: overallRate,
        dueSoonCount,
      },
      courses: courseStats,
    },
  });
});
