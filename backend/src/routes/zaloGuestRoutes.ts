import { Router } from 'express';
import { getGuestUsers, getGuestUserById } from '../controllers/zaloGuestController';
import { authenticateToken } from '../middleware/authenticateJWT';
import GuestUser from '../models/ZaloGuestUser';
const router = Router();

// ✅ Lấy toàn bộ khách hàng Zalo
router.get('/guest-users', authenticateToken, getGuestUsers);

// ✅ Lấy 1 khách hàng theo ID
router.get('/guest-users/:id', authenticateToken, getGuestUserById);
/**
 * Endpoint dành cho mini app: trả về guestId
 * Không cần token telesale/admin
 */
router.get('/guest-id-for-mini-app', async (req, res) => {
  try {
    // Lấy guest mới nhất trong DB, hoặc tuỳ logic của bạn
    const guestUser = await GuestUser.findOne().sort({ updatedAt: -1 }).lean();

    if (!guestUser) {
      res.status(404).json({ message: 'Không tìm thấy guest' });
       return
    }

    res.json({ guestId: guestUser._id });
  } catch (err: any) {
    console.error('❌ Lỗi khi lấy guestId cho mini app:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});
export default router;
