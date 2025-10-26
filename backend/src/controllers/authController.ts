import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not defined.");
}

// ------------------ Hàm đăng ký ------------------
export const register = async (req: Request, res: Response): Promise<void> => {
  const email = req.body.email?.trim();
  const password = req.body.password?.trim();
  const confirmPassword = req.body.confirmPassword?.trim();
  const username = req.body.username?.trim();
  const phone = req.body.phone?.trim();
  const address = req.body.address?.trim();
  const role = req.body.role?.trim() as "admin" | "telesale" | undefined;
  const avatar = req.file; // Nhận file ảnh từ request gửi lên

  console.log("Đã nhận request đăng ký:", req.body);

  if (!email || !password || !confirmPassword || !username || !phone || !address) {
    res.status(400).json({ message: "Thiếu thông tin đăng ký." });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ message: "Mật khẩu xác nhận không khớp." });
    return;
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: "Email đã tồn tại." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      username,
      phone,
      address,
      avatar: avatar
        ? { path: avatar.path, filename: avatar.filename, originalname: avatar.originalname }
        : undefined, // optional
      role: role || "telesale", // default telesale
    });

    await newUser.save();
    console.log(`✅ Tạo user mới: ${username} với role: ${newUser.role}`);

    res.status(201).json({ message: "Đăng ký thành công.", user: { id: newUser._id, username: newUser.username, role: newUser.role } });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Lỗi server khi đăng ký." });
  }
};

// ------------------ Hàm đăng nhập ------------------
export const login = async (req: Request, res: Response): Promise<void> => {
  const email = req.body.email?.trim();
  const password = req.body.password?.trim();

  if (!email || !password) {
    res.status(400).json({ message: "Thiếu email hoặc mật khẩu." });
    return;
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Email không tồn tại." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Mật khẩu không đúng." });
      return;
    }

    // Tạo JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log(`🔑 User ${user.username} đăng nhập thành công với role: ${user.role}`);

    res.status(200).json({
      message: "Đăng nhập thành công.",
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
    console.error("Login Error:", err);
    res.status(500).json({ message: "Lỗi server khi đăng nhập." });
  }
};
