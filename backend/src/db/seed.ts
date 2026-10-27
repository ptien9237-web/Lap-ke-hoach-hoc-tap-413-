import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDatabase } from './database';

export function seedData(db = getDatabase()) {
  // Check if demo user already exists
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('student@study.edu.vn') as { id: string } | undefined;
  if (existingUser) {
    console.log('Seed data already present, skipping...');
    return existingUser.id;
  }

  const userId = crypto.randomUUID();
  const passwordHash = bcrypt.hashSync('Password123!', 10);

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash)
    VALUES (?, ?, ?, ?)
  `).run(userId, 'Nguyen Van Tien', 'student@study.edu.vn', passwordHash);

  // 6 Courses for university student
  const courses = [
    { id: crypto.randomUUID(), code: 'INT3102', name: 'Lập trình Mobile', colour: 'courseBlue' },
    { id: crypto.randomUUID(), code: 'INT3110', name: 'Kiến trúc phần mềm', colour: 'courseEmerald' },
    { id: crypto.randomUUID(), code: 'INT3201', name: 'Cơ sở dữ liệu nâng cao', colour: 'coursePurple' },
    { id: crypto.randomUUID(), code: 'INT3305', name: 'Trí tuệ nhân tạo', colour: 'courseAmber' },
    { id: crypto.randomUUID(), code: 'MAT1093', name: 'Xác suất thống kê', colour: 'courseRose' },
    { id: crypto.randomUUID(), code: 'ENG2001', name: 'Tiếng Anh chuyên ngành CNTT', colour: 'courseIndigo' },
  ];

  const insertCourse = db.prepare(`
    INSERT INTO courses (id, user_id, code, name, colour)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const c of courses) {
    insertCourse.run(c.id, userId, c.code, c.name, c.colour);
  }

  // Base dates relative to now
  const now = new Date();
  
  // Today 23:30
  const todayDue = new Date(now);
  todayDue.setHours(23, 30, 0, 0);

  // Tomorrow 17:00
  const tomorrowDue = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  tomorrowDue.setHours(17, 0, 0, 0);

  // In 2 days 20:00
  const inTwoDaysDue = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  inTwoDaysDue.setHours(20, 0, 0, 0);

  // In 4 days
  const inFourDaysDue = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
  inFourDaysDue.setHours(23, 59, 0, 0);

  // In 6 days
  const inSixDaysDue = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
  inSixDaysDue.setHours(12, 0, 0, 0);

  // Yesterday completed
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const assignments = [
    {
      id: crypto.randomUUID(),
      course_id: courses[0].id,
      title: 'Báo cáo đồ án cuối kỳ Mobile App (Student Planner)',
      due_at: todayDue.toISOString(),
      status: 'pending',
      notes: 'Hoàn thiện Expo SDK 58, route động, modal, offline sync và tài liệu.',
    },
    {
      id: crypto.randomUUID(),
      course_id: courses[0].id,
      title: 'Slide thuyết trình vấn đáp Mobile',
      due_at: tomorrowDue.toISOString(),
      status: 'pending',
      notes: 'Chuẩn bị demo thiết bị thật và giải thích kiến trúc.',
    },
    {
      id: crypto.randomUUID(),
      course_id: courses[1].id,
      title: 'Thiết kế kiến trúc vi dịch vụ (Microservices Diagram)',
      due_at: inTwoDaysDue.toISOString(),
      status: 'pending',
      notes: 'Vẽ sơ đồ C4 model và phân tích trade-off.',
    },
    {
      id: crypto.randomUUID(),
      course_id: courses[2].id,
      title: 'Tối ưu hóa chỉ mục Indexing & Query Execution Plan',
      due_at: inFourDaysDue.toISOString(),
      status: 'pending',
      notes: 'Thực hiện EXPLAIN QUERY PLAN trên cơ sở dữ liệu SQLite/Postgres.',
    },
    {
      id: crypto.randomUUID(),
      course_id: courses[3].id,
      title: 'Báo cáo huấn luyện mô hình phân loại văn bản',
      due_at: inSixDaysDue.toISOString(),
      status: 'pending',
      notes: 'Sử dụng TF-IDF và Logistic Regression.',
    },
    {
      id: crypto.randomUUID(),
      course_id: courses[4].id,
      title: 'Bài tập tuần 8: Phân phối chuẩn và định lý giới hạn trung tâm',
      due_at: yesterday.toISOString(),
      status: 'completed',
      notes: 'Đã nộp qua hệ thống LMS ngày hôm qua.',
    },
    {
      id: crypto.randomUUID(),
      course_id: courses[5].id,
      title: 'Viết bài luận tóm tắt bài báo khoa học IEEE',
      due_at: todayDue.toISOString(),
      status: 'completed',
      notes: 'Topic: Mobile edge computing & offline-first architectures.',
    },
    {
      id: crypto.randomUUID(),
      course_id: courses[1].id,
      title: 'Kiểm thử đơn vị Unit Test cho domain layer',
      due_at: yesterday.toISOString(),
      status: 'completed',
      notes: 'Độ phủ test đạt 85%.',
    },
  ];

  const insertAssignment = db.prepare(`
    INSERT INTO assignments (id, user_id, course_id, title, due_at, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const a of assignments) {
    insertAssignment.run(a.id, userId, a.course_id, a.title, a.due_at, a.status, a.notes);
  }

  console.log(`Seeded demo user student@study.edu.vn with ${courses.length} courses and ${assignments.length} assignments.`);
  return userId;
}

if (require.main === module) {
  seedData();
}
