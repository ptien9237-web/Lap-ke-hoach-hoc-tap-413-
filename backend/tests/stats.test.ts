import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Progress Statistics API', () => {
  let token = '';

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Stats Tester',
        email: `stats_tester_${Date.now()}@study.edu.vn`,
        password: 'Password123!',
      });
    token = res.body.data.token;

    // Course 1
    const c1 = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'STAT101', name: 'Toán học', colour: 'courseBlue' });

    // Course 2 (empty course)
    await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'EMPTY202', name: 'Học phần chưa có bài tập', colour: 'courseRose' });

    // Assignment 1 (completed)
    await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        courseId: c1.body.data.course.id,
        title: 'Bài tập 1 đã hoàn thành',
        dueAt: new Date().toISOString(),
        status: 'completed',
      });

    // Assignment 2 (pending)
    await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        courseId: c1.body.data.course.id,
        title: 'Bài tập 2 chưa hoàn thành',
        dueAt: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      });
  });

  it('should compute exact dynamically calculated statistics and handle empty courses', async () => {
    const res = await request(app)
      .get('/api/stats/progress')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const { overview, courses } = res.body.data;

    expect(overview.totalAssignments).toBe(2);
    expect(overview.completedAssignments).toBe(1);
    expect(overview.pendingAssignments).toBe(1);
    expect(overview.completionRate).toBe(50);
    expect(overview.dueSoonCount).toBe(1);

    // Empty course STAT check
    const emptyCourse = courses.find((c: any) => c.courseCode === 'EMPTY202');
    expect(emptyCourse).toBeDefined();
    expect(emptyCourse.total).toBe(0);
    expect(emptyCourse.completed).toBe(0);
    expect(emptyCourse.pending).toBe(0);
    expect(emptyCourse.completionRate).toBe(0);

    // STAT101 check
    const stat101 = courses.find((c: any) => c.courseCode === 'STAT101');
    expect(stat101).toBeDefined();
    expect(stat101.total).toBe(2);
    expect(stat101.completed).toBe(1);
    expect(stat101.pending).toBe(1);
    expect(stat101.completionRate).toBe(50);
  });
});
