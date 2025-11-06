import { Router } from 'express';
import {
  getGuestUsers,
  getGuestUserById,
  updateGuestLabel,
} from '../controllers/zaloGuestController';
import { authenticateToken } from '../middleware/authenticateJWT';
import ActiveCall from '../models/ActiveCall';
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
    // Lấy cuộc gọi đang active mới nhất
    const activeCall = await ActiveCall.findOne({ status: 'calling' }).sort({ createdAt: -1 }).lean();

    if (!activeCall) {
      res.status(404).json({ message: 'Không có khách nào đang gọi' });
       return
    }

    res.json({ guestId: activeCall.guestId });
  } catch (err: any) {
    console.error('❌ Lỗi khi lấy guestId đang gọi:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

    if (!activeCall) {
      res.status(404).json({ message: 'Không có khách nào đang gọi' });
      return;
    }

    res.json({ guestId: activeCall.guestId });
  } catch (err: any) {
    console.error('❌ Lỗi khi lấy guestId đang gọi:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});
// ✅ Cập nhật nhãn cho khách hàng Zalo
router.put('/guest-users/:userId/label', authenticateToken, updateGuestLabel);
export default router;
