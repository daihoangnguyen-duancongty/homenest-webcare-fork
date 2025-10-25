import { Request, Response, NextFunction } from 'express';

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


// 🔒 Chỉ cho phép Admin
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