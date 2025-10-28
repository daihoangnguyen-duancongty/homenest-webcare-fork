import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// ------------------ Hàm đăng ký ------------------
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, confirmPassword, username, phone, address, role } = req.body;
    const avatar = req.file;

    if (!email || !password || !confirmPassword || !username || !phone || !address) {
      res.status(400).json({ message: 'Thiếu thông tin đăng ký.' });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).json({ message: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: 'Email đã tồn tại.' });
      return;
    }

    // 🔹 Hash password trước khi tạo User
    const hashedPassword = await User.hashPassword(password);

    const newUser = new User({
      email,
      password, 
      username,
      phone,
      address,
      avatar: avatar
        ? { path: avatar.path, filename: avatar.filename, originalname: avatar.originalname }
        : undefined,
      role: role || 'telesale',
    });

    await newUser.save();

    res.status(201).json({
      message: 'Đăng ký thành công.',
      user: { id: newUser._id, username: newUser.username, role: newUser.role },
    });
  } catch (err: any) {
    console.error('Register Error:', err);
    res.status(500).json({ message: 'Lỗi server khi đăng ký.' });
  }
};
// ------------------ Hàm đăng nhập ------------------
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // 🔹 Log body nhận được
    console.log('--- [LOGIN] req.body ---', req.body);

    if (!req.body || typeof req.body !== 'object') {
      console.warn('⚠️ req.body is missing or not an object');
      res.status(400).json({ message: 'Không có dữ liệu gửi lên.' });
      return;
    }

    const email = typeof req.body.email === 'string' ? req.body.email.trim() : null;
    const password = typeof req.body.password === 'string' ? req.body.password.trim() : null;

    console.log('--- [LOGIN] email:', email, 'password exists:', !!password);

    if (!email || !password) {
      res.status(400).json({ message: 'Thiếu email hoặc mật khẩu.' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.warn('⚠️ User not found for email:', email);
      res.status(401).json({ message: 'Email không tồn tại.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.warn('⚠️ Password mismatch for email:', email);
      res.status(401).json({ message: 'Mật khẩu không đúng.' });
      return;
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    console.log('✅ [LOGIN] Success for user:', email);

    res.status(200).json({
      message: 'Đăng nhập thành công.',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('❌ [LOGIN] Server error:', err);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập.' });
  }
};