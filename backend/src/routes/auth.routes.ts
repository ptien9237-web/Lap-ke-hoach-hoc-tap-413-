import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getDatabase } from '../db/database';
import { config } from '../config';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Tên người dùng phải có ít nhất 2 ký tự').max(100),
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

// Register
authRouter.post('/register', validateBody(registerSchema), (req, res: Response) => {
  const { name, email, password } = req.body;
  const db = getDatabase();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({
      success: false,
      error: {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email này đã được sử dụng. Vui lòng chọn email khác.',
      },
    });
    return;
  }

  const userId = crypto.randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash)
    VALUES (?, ?, ?, ?)
  `).run(userId, name.trim(), email.trim().toLowerCase(), passwordHash);

  const token = jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any });

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
      },
    },
  });
});

// Login
authRouter.post('/login', validateBody(loginSchema), (req, res: Response) => {
  const { email, password } = req.body;
  const db = getDatabase();

  const user = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(email.trim().toLowerCase()) as {
    id: string;
    name: string;
    email: string;
    password_hash: string;
  } | undefined;

  if (!user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Email hoặc mật khẩu không chính xác.',
      },
    });
    return;
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
  if (!isPasswordValid) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Email hoặc mật khẩu không chính xác.',
      },
    });
    return;
  }

  const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
  });
});

// Logout (token revocation)
authRouter.post('/logout', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const token = req.token!;
  const userId = req.userId!;

  // Add to revoked tokens
  db.prepare(`
    INSERT OR REPLACE INTO revoked_tokens (token, user_id, revoked_at)
    VALUES (?, ?, datetime('now'))
  `).run(token, userId);

  res.json({
    success: true,
    data: {
      message: 'Đăng xuất thành công. Phiên làm việc đã bị hủy hoàn toàn.',
    },
  });
});

// Get current profile
authRouter.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.userId!) as {
    id: string;
    name: string;
    email: string;
    created_at: string;
  } | undefined;

  if (!user) {
    res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'Tài khoản không tồn tại trên hệ thống.',
      },
    });
    return;
  }

  res.json({
    success: true,
    data: { user },
  });
});
