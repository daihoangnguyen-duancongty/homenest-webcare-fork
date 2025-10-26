// authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Mở rộng Request để bao gồm user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    username?: string;
    role: 'admin' | 'telesale';
    [key: string]: any;
  };
}

// Middleware xác thực JWT
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Không có token, truy cập bị từ chối.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      role: 'admin' | 'telesale';
      [key: string]: any;
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token không hợp lệ.' });
  }
};

// Chỉ admin mới được truy cập
export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Quyền truy cập bị từ chối. Cần quyền admin.' });
    return; // chỉ return để dừng hàm, không trả về Response
  }
  next();
};

// Chỉ telesale
export const authorizeTelesale = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'telesale') {
    res.status(403).json({ message: 'Quyền truy cập bị từ chối. Cần quyền telesale.' });
    return;
  }
  next();
};

// Cho phép nhiều role
export const authorizeRoles = (roles: Array<'admin' | 'telesale'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Quyền truy cập bị từ chối.' });
      return;
    }
    next();
  };
};