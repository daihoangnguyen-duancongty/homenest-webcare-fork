import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not defined.');

// ------------------ Register ------------------
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, confirmPassword, username, phone, address, role } = req.body;
  const file = req.file; // Nếu dùng multer để upload avatar

  if (!email || !password || !confirmPassword || !username || !phone || !address) {
    res.status(400).json({ message: 'Thiếu thông tin đăng ký.' });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ message: 'Mật khẩu xác nhận không khớp.' });
    return;
  }

  try {
    const existing: IUser | null = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: 'Email đã tồn tại.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: IUser = new User({
      email,
      password: hashedPassword,
      username,
      phone,
      address,
      role: role || 'telesale',
      avatar: file
        ? {
            path: file.path,
            filename: file.filename,
            originalname: file.originalname,
          }
        : undefined,
    });

    await newUser.save();
    console.log(`✅ Tạo user mới: ${username} với role: ${newUser.role}`);

    res.status(201).json({
      message: 'Đăng ký thành công.',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        role: newUser.role,
        avatar: newUser.avatar,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    });
  } catch (err: any) {
    console.error('Register Error:', err);
    res.status(500).json({ message: 'Lỗi server khi đăng ký.', error: err.message });
  }
};

// ------------------ Login ------------------
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Thiếu email hoặc mật khẩu.' });
    return;
  }

  try {
    const user: IUser | null = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Email không tồn tại.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Mật khẩu không đúng.' });
      return;
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Đăng nhập thành công.',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        phone: user.phone,
        address: user.address,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err: any) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập.', error: err.message });
  }
};
