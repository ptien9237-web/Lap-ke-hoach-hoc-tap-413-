import { beforeAll, afterAll } from 'vitest';
import { getDatabase, closeDatabase } from '../src/db/database';

beforeAll(() => {
  // Use in-memory SQLite database for clean, isolated, fast test runs
  process.env.DATABASE_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-secret-key-12345';
  getDatabase(':memory:');
});

afterAll(() => {
  closeDatabase();
});
