import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { authenticateToken } from '../middleware/authenticateJWT';
import { authorizeAdmin, authorizeTelesale, authorizeRoles } from '../middleware/authorizeRole';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController';
import UserModel from '../models/User';
import upload from '../middleware/uploadCloud';

const router = Router();

// ✅ Route đăng ký (có upload avatar) -> upload len cloudinary
router.post('/register', upload.single('avatar'), register);

// ✅ Route đăng nhập
router.post('/login', login);

// ✅ Admin Dashboard
router.get('/admin-dashboard', authenticateToken, authorizeAdmin, (req, res) => {
  res.json({ message: 'Chào mừng bạn đến với trang quản trị' });
});

// ✅ Telesale Dashboard
router.get('/telesale-dashboard', authenticateToken, authorizeTelesale, (req, res) => {
  res.json({ message: 'Chào mừng bạn đến với trang telesale' });
});

// ✅ Dashboard chung
router.get('/dashboard', authenticateToken, authorizeRoles(['admin', 'telesale']), (req, res) => {
  res.json({ message: 'Chào mừng bạn đến với dashboard CRM' });
});
// ✅ Lấy danh sách nhân viên (telesales)
router.get('/employees', authenticateToken, authorizeAdmin, getEmployees);
// ✅ Lấy  nhân viên (telesales) theo ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).lean();
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// ✅ Tạo nhân viên mới
router.post(
  '/employees',
  authenticateToken,
  authorizeAdmin,
  upload.single('avatar'),
  createEmployee
);

// ✅ Cập nhật nhân viên
router.put(
  '/employees/:id',
  authenticateToken,
  authorizeAdmin,
  upload.single('avatar'),
  updateEmployee
);

// ✅ Xóa nhân viên
router.delete('/employees/:id', authenticateToken, authorizeAdmin, deleteEmployee);

export default router;
