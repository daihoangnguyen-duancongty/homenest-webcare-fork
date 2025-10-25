import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import bcrypt from 'bcryptjs';

export const getEmployees = async (_req: Request, res: Response) => {
  try {
    const employees = await User.find({}, '-password');
    res.json(employees);
  } catch (err) {
    console.error('❌ Lỗi getEmployees:', err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách nhân viên' });
  }
};


export const createEmployee = async (req: Request, res: Response) => {
  const { username, email, phone, address, password, role } = req.body;
  if (!username || !email || !phone || !address || !password) {
    res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    return;
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: 'Email đã tồn tại' });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);

 const avatarUrl = (req.file as any)?.path || null; // ✅ Cloudinary trả về URL ảnh

const newUser = new User({
  username,
  email,
  phone,
  address,
  password: hashed,
  role: role || 'telesale',
  avatar: avatarUrl ? { path: avatarUrl } : undefined, // ✅ thêm dòng này
});


    await newUser.save();

    res.status(201).json({ message: 'Tạo nhân viên thành công', user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi tạo nhân viên' });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, email, phone, address, password, role } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'Nhân viên không tồn tại' });
      return;
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (role) user.role = role;

   if (password) {
  user.password = await bcrypt.hash(password, 10);
}

if (req.file) {
  user.avatar = { path: (req.file as any).path }; // ✅ cập nhật URL Cloudinary nếu có file mới
}

await user.save();
res.json({ message: 'Cập nhật nhân viên thành công', user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật nhân viên' });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'Nhân viên không tồn tại' });
      return;
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'Xóa nhân viên thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi xóa nhân viên' });
  }
};
