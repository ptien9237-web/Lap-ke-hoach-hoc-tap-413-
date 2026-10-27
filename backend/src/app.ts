import express, { Application } from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes';
import { courseRouter } from './routes/course.routes';
import { assignmentRouter } from './routes/assignment.routes';
import { statsRouter } from './routes/stats.routes';
import { syncRouter } from './routes/sync.routes';
import { errorHandler } from './middleware/error';

export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Student Study Planner API',
      version: '1.0.0',
    });
  });

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/courses', courseRouter);
  app.use('/api/assignments', assignmentRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/sync', syncRouter);

  // 404 handler for unknown routes
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Đường dẫn ${req.originalUrl} không tồn tại trên hệ thống API.`,
      },
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
