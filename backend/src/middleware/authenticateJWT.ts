import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Mở rộng Request để bao gồm thuộc tính user
export interface AuthRequest extends Request {
  user?: { role: 'admin' | 'customer' | 'telesale'; [key: string]: any };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    res.status(401).json({ message: 'Không có token, truy cập bị từ chối.' });
    return;
  }

  try {
    // Ép kiểu giá trị decoded thành { role: "admin" | "customer" | "telesale"; ... }
    const decoded = jwt.verify(token, JWT_SECRET) as {
      role: 'admin' | 'customer' | 'telesale';
      [key: string]: any;
    };
    console.log('Decoded user từ token:', decoded);
    req.user = decoded; // Lưu thông tin user vào req để dùng ở route sau
    next();
  } catch (err) {
    res.status(403).json({ message: 'Token không hợp lệ.' });
    return;
  }
};
