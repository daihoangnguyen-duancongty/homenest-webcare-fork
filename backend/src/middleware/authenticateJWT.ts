import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Mở rộng Request để bao gồm user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    username?: string;
    role: 'admin' | 'telesale';
      avatar?: string | { path?: string; filename?: string; originalname?: string };
    [key: string]: any;
    
  };
}

// ✅ Middleware xác thực JWT và load user từ DB
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1]; // Bearer <token>

  if (!token) {
    res.status(401).json({ message: 'Không có token, truy cập bị từ chối.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const user = await UserModel.findById(decoded.id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy người dùng.' });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      avatar: user.avatar,
    };

    next();
  } catch (err) {
    console.error('❌ Lỗi xác thực JWT:', err);
    res.status(403).json({ message: 'Token không hợp lệ.' });
  }
};
