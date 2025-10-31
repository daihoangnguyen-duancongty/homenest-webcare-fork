import { Router } from 'express';
import { getGuestUsers, getGuestUserById } from '../controllers/zaloGuestController';
import { authenticateToken } from '../middleware/authenticateJWT';

const router = Router();

// ✅ Lấy toàn bộ khách hàng Zalo
router.get('/guest-users', authenticateToken, getGuestUsers);

// ✅ Lấy 1 khách hàng theo ID
router.get('/guest-users/:id', authenticateToken, getGuestUserById);

export default router;
