import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getDatabase } from '../db/database';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  token?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Yêu cầu token xác thực hợp lệ (Authorization: Bearer <token>).',
      },
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };

    // Check if token was revoked (user logged out)
    const db = getDatabase();
    const revoked = db.prepare('SELECT token FROM revoked_tokens WHERE token = ?').get(token);
    if (revoked) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REVOKED',
          message: 'Phiên đăng nhập đã kết thúc (token đã bị hủy do đăng xuất).',
        },
      });
      return;
    }

    req.userId = decoded.userId;
    req.token = token;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        },
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token xác thực không hợp lệ hoặc đã bị thay đổi.',
      },
    });
  }
}
