import { createApp } from './app';
import { config } from './config';
import { getDatabase } from './db/database';
import { seedData } from './db/seed';

// Ensure database and schema are initialized
const db = getDatabase();
// Auto seed demo data if table is empty
seedData(db);

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 Student Study Planner Backend running at:`);
  console.log(`   http://localhost:${config.port}`);
  console.log(`   Health check: http://localhost:${config.port}/health`);
  console.log(`   Environment:  ${config.nodeEnv}`);
  console.log(`   Database:     ${config.databasePath}`);
  console.log(`====================================================`);
});

export { app, server };
