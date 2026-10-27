import { Router, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { getDatabase } from '../db/database';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

export const syncRouter = Router();

syncRouter.use(authMiddleware);

const mutationItemSchema = z.object({
  clientMutationId: z.string().min(1),
  entity: z.enum(['assignment', 'course']),
  action: z.enum(['create', 'update', 'toggle', 'delete']),
  payload: z.record(z.any()),
});

const syncBatchSchema = z.object({
  mutations: z.array(mutationItemSchema),
});

syncRouter.post('/', validateBody(syncBatchSchema), (req: AuthenticatedRequest, res: Response) => {
  const { mutations } = req.body;
  const db = getDatabase();
  const userId = req.userId!;

  const results: Array<{
    clientMutationId: string;
    success: boolean;
    status: 'applied' | 'already_applied' | 'failed';
    error?: string;
    serverEntityId?: string;
  }> = [];

  for (const mut of mutations) {
    const { clientMutationId, entity, action, payload } = mut;

    // Check idempotency
    const existingLog = db.prepare('SELECT client_mutation_id, server_entity_id FROM mutation_logs WHERE client_mutation_id = ? AND user_id = ?').get(clientMutationId, userId) as { client_mutation_id: string; server_entity_id: string } | undefined;
    if (existingLog) {
      results.push({
        clientMutationId,
        success: true,
        status: 'already_applied',
        serverEntityId: existingLog.server_entity_id,
      });
      continue;
    }

    try {
      if (entity === 'assignment') {
        if (action === 'create') {
          const assignmentId = payload.id || crypto.randomUUID();
          // Verify course ownership
          const course = db.prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?').get(payload.courseId, userId);
          if (!course) {
            results.push({
              clientMutationId,
              success: false,
              status: 'failed',
              error: 'Học phần không hợp lệ hoặc không thuộc tài khoản của bạn.',
            });
            continue;
          }

          db.prepare(`
            INSERT OR REPLACE INTO assignments (id, user_id, course_id, title, due_at, status, notes, photo_uri)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            assignmentId,
            userId,
            payload.courseId,
            String(payload.title || '').trim(),
            payload.dueAt,
            payload.status || 'pending',
            payload.notes ? String(payload.notes).trim() : null,
            payload.photoUri || null
          );

          db.prepare(`
            INSERT INTO mutation_logs (client_mutation_id, user_id, entity, action, server_entity_id)
            VALUES (?, ?, ?, ?, ?)
          `).run(clientMutationId, userId, entity, action, assignmentId);

          results.push({
            clientMutationId,
            success: true,
            status: 'applied',
            serverEntityId: assignmentId,
          });
        } else if (action === 'update') {
          const assignmentId = payload.id;
          const existing = db.prepare('SELECT id FROM assignments WHERE id = ? AND user_id = ?').get(assignmentId, userId);
          if (!existing) {
            results.push({
              clientMutationId,
              success: false,
              status: 'failed',
              error: 'Bài tập không tồn tại hoặc bạn không có quyền cập nhật.',
            });
            continue;
          }

          db.prepare(`
            UPDATE assignments
            SET 
              course_id = COALESCE(?, course_id),
              title = COALESCE(?, title),
              due_at = COALESCE(?, due_at),
              status = COALESCE(?, status),
              notes = COALESCE(?, notes),
              photo_uri = COALESCE(?, photo_uri),
              updated_at = datetime('now')
            WHERE id = ? AND user_id = ?
          `).run(
            payload.courseId || null,
            payload.title ? String(payload.title).trim() : null,
            payload.dueAt || null,
            payload.status || null,
            payload.notes !== undefined ? (payload.notes ? String(payload.notes).trim() : null) : null,
            payload.photoUri !== undefined ? payload.photoUri : null,
            assignmentId,
            userId
          );

          db.prepare(`
            INSERT INTO mutation_logs (client_mutation_id, user_id, entity, action, server_entity_id)
            VALUES (?, ?, ?, ?, ?)
          `).run(clientMutationId, userId, entity, action, assignmentId);

          results.push({
            clientMutationId,
            success: true,
            status: 'applied',
            serverEntityId: assignmentId,
          });
        } else if (action === 'toggle') {
          const assignmentId = payload.id;
          const existing = db.prepare('SELECT status FROM assignments WHERE id = ? AND user_id = ?').get(assignmentId, userId) as { status: string } | undefined;
          if (!existing) {
            results.push({
              clientMutationId,
              success: false,
              status: 'failed',
              error: 'Bài tập không tồn tại.',
            });
            continue;
          }

          const targetStatus = payload.status || (existing.status === 'completed' ? 'pending' : 'completed');
          db.prepare(`
            UPDATE assignments
            SET status = ?, updated_at = datetime('now')
            WHERE id = ? AND user_id = ?
          `).run(targetStatus, assignmentId, userId);

          db.prepare(`
            INSERT INTO mutation_logs (client_mutation_id, user_id, entity, action, server_entity_id)
            VALUES (?, ?, ?, ?, ?)
          `).run(clientMutationId, userId, entity, action, assignmentId);

          results.push({
            clientMutationId,
            success: true,
            status: 'applied',
            serverEntityId: assignmentId,
          });
        } else if (action === 'delete') {
          const assignmentId = payload.id;
          db.prepare('DELETE FROM assignments WHERE id = ? AND user_id = ?').run(assignmentId, userId);

          db.prepare(`
            INSERT INTO mutation_logs (client_mutation_id, user_id, entity, action, server_entity_id)
            VALUES (?, ?, ?, ?, ?)
          `).run(clientMutationId, userId, entity, action, assignmentId);

          results.push({
            clientMutationId,
            success: true,
            status: 'applied',
            serverEntityId: assignmentId,
          });
        }
      } else if (entity === 'course') {
        if (action === 'create') {
          const courseId = payload.id || crypto.randomUUID();
          db.prepare(`
            INSERT OR REPLACE INTO courses (id, user_id, code, name, colour)
            VALUES (?, ?, ?, ?, ?)
          `).run(courseId, userId, String(payload.code).trim(), String(payload.name).trim(), String(payload.colour).trim());

          db.prepare(`
            INSERT INTO mutation_logs (client_mutation_id, user_id, entity, action, server_entity_id)
            VALUES (?, ?, ?, ?, ?)
          `).run(clientMutationId, userId, entity, action, courseId);

          results.push({
            clientMutationId,
            success: true,
            status: 'applied',
            serverEntityId: courseId,
          });
        }
      }
    } catch (err: any) {
      results.push({
        clientMutationId,
        success: false,
        status: 'failed',
        error: err.message || 'Lỗi trong quá trình thực thi mutation.',
      });
    }
  }

  res.json({
    success: true,
    data: {
      serverTime: new Date().toISOString(),
      processedCount: results.length,
      results,
    },
  });
});
