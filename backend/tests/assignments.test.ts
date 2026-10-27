import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Assignments and Courses API', () => {
  let token = '';
  let courseId = '';
  let assignmentId = '';

  beforeAll(async () => {
    // Register test user
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Assignment Tester',
        email: `assign_tester_${Date.now()}@study.edu.vn`,
        password: 'Password123!',
      });
    token = res.body.data.token;

    // Create a course
    const courseRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'INT3102',
        name: 'Lập trình di động',
        colour: 'courseBlue',
      });
    courseId = courseRes.body.data.course.id;
  });

  it('should create an assignment with valid ISO dueAt', async () => {
    const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        courseId,
        title: 'Làm bài tập lớn Expo Router',
        dueAt,
        notes: 'Triển khai đủ 5 màn hình và offline queue',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assignment.title).toBe('Làm bài tập lớn Expo Router');
    expect(res.body.data.assignment.status).toBe('pending');
    expect(res.body.data.assignment.courseCode).toBe('INT3102');
    assignmentId = res.body.data.assignment.id;
  });

  it('should list assignments with filter', async () => {
    const res = await request(app)
      .get(`/api/assignments?courseId=${courseId}&status=pending`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.assignments)).toBe(true);
    expect(res.body.data.assignments.length).toBeGreaterThanOrEqual(1);
  });

  it('should get assignment details by ID', async () => {
    const res = await request(app)
      .get(`/api/assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assignment.id).toBe(assignmentId);
    expect(res.body.data.assignment.courseName).toBe('Lập trình di động');
  });

  it('should toggle assignment status to completed', async () => {
    const res = await request(app)
      .patch(`/api/assignments/${assignmentId}/toggle`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assignment.status).toBe('completed');
  });

  it('should toggle assignment status back to pending', async () => {
    const res = await request(app)
      .patch(`/api/assignments/${assignmentId}/toggle`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assignment.status).toBe('pending');
  });

  it('should update assignment notes and title', async () => {
    const res = await request(app)
      .put(`/api/assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Cập nhật tiêu đề bài tập lớn',
        notes: 'Đã hoàn thiện 100% các tiêu chí',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assignment.title).toBe('Cập nhật tiêu đề bài tập lớn');
    expect(res.body.data.assignment.notes).toBe('Đã hoàn thiện 100% các tiêu chí');
  });

  it('should delete assignment successfully', async () => {
    const res = await request(app)
      .delete(`/api/assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it is gone
    const verifyRes = await request(app)
      .get(`/api/assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(verifyRes.status).toBe(404);
  });
});
