import { Router } from 'express';
import multer from 'multer';
import { register, login } from '../controllers/authController';
import path from 'path';

const router = Router();

// -------------------- Cấu hình Multer --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads')); // lưu vào thư mục uploads
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // tránh trùng tên
  },
});
const upload = multer({ storage });

// -------------------- Routes --------------------
router.post('/register', upload.single('avatar'), register);
router.post('/login', login);

export default router;
