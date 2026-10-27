import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Data Isolation and IDOR Protection', () => {
  let userAToken = '';
  let userBToken = '';
  let userACourseId = '';
  let userAAssignmentId = '';

  beforeAll(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User Alpha',
        email: `usera_${Date.now()}@study.edu.vn`,
        password: 'Password123!',
      });
    userAToken = resA.body.data.token;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User Beta',
        email: `userb_${Date.now()}@study.edu.vn`,
        password: 'Password123!',
      });
    userBToken = resB.body.data.token;

    // User A creates course
    const courseRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        code: 'SECRET101',
        name: 'Khóa học bí mật User A',
        colour: 'coursePurple',
      });
    userACourseId = courseRes.body.data.course.id;

    // User A creates assignment
    const assignRes = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        courseId: userACourseId,
        title: 'Bài tập riêng tư của User A',
        dueAt: new Date().toISOString(),
      });
    userAAssignmentId = assignRes.body.data.assignment.id;
  });

  it('should NOT allow User B to view User A assignment details (IDOR check)', async () => {
    const res = await request(app)
      .get(`/api/assignments/${userAAssignmentId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should NOT allow User B to edit User A assignment', async () => {
    const res = await request(app)
      .put(`/api/assignments/${userAAssignmentId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        title: 'User B cố tình thay đổi tiêu đề bài tập',
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should NOT allow User B to toggle User A assignment', async () => {
    const res = await request(app)
      .patch(`/api/assignments/${userAAssignmentId}/toggle`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should NOT allow User B to delete User A assignment', async () => {
    const res = await request(app)
      .delete(`/api/assignments/${userAAssignmentId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should NOT allow User B to create assignment inside User A course', async () => {
    const res = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        courseId: userACourseId,
        title: 'User B inject vào khóa học User A',
        dueAt: new Date().toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_COURSE');
  });

  it('should NOT show User A assignments in User B assignment list', async () => {
    const res = await request(app)
      .get('/api/assignments')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const ids = res.body.data.assignments.map((a: any) => a.id);
    expect(ids).not.toContain(userAAssignmentId);
  });
});
