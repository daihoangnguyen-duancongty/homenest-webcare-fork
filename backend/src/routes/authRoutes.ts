import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { authenticateToken } from '../middleware/authenticateJWT';
import { authorizeAdmin, authorizeTelesale, authorizeRoles } from '../middleware/authorizeRole';
import multer from 'multer';
import User from '../models/User';
const router = Router();

// Cấu hình multer để xử lý file tải lên avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// Đăng ký người dùng mới (admin hoặc telesale)
router.post('/register', upload.single('avatar'), register);

// Đăng nhập và trả về token + role
router.post('/login', login);

// Dashboard admin (chỉ admin mới truy cập được)
router.get('/admin-dashboard', authenticateToken, authorizeAdmin, (req, res) => {
  res.json({ message: 'Chào mừng bạn đến với trang quản trị' });
});

// Dashboard telesale (chỉ telesale mới truy cập được)
router.get('/telesale-dashboard', authenticateToken, authorizeTelesale, (req, res) => {
  res.json({ message: 'Chào mừng bạn đến với trang telesale' });
});

// Dashboard cho cả admin + telesale (nếu cần)
router.get('/dashboard', authenticateToken, authorizeRoles(['admin', 'telesale']), (req, res) => {
  res.json({ message: 'Chào mừng bạn đến với dashboard CRM' });
});
router.post('/debug-check', async (req, res) => {
  const bcrypt = require('bcryptjs');
  const user = await User.findOne({ email: req.body.email });

  // ✅ Kiểm tra nếu không tìm thấy user
  if (!user) {
    res.status(404).json({ success: false, message: 'Không tìm thấy user với email này.' });
    return;
  }

  // ✅ So sánh mật khẩu
  const ok = await bcrypt.compare(req.body.password, user.password);

  res.json({
    success: true,
    passwordInput: req.body.password,
    dbHash: user.password,
    match: ok,
  });
});

export default router;
