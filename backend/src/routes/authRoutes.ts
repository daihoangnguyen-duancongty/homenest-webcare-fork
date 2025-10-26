import { Router } from 'express';
import multer from 'multer';
import { register, login } from '../controllers/authController';

const router = Router();
const upload = multer({ dest: 'uploads/' }); // hoặc config Cloudinary storage

router.post('/register', upload.single('avatar'), register);
router.post('/login', login);

export default router;
