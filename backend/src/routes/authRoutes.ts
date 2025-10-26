import { Router } from 'express';
import { register, login } from '../controllers/authController';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Tạo folder uploads nếu chưa có
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

router.post('/register', upload.single('avatar'), register);
router.post('/login', login);

export default router;
