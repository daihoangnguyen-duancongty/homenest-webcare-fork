import { Router } from 'express';
import { authenticateToken } from '../middleware/authenticateJWT';
import { authorizeRoles } from '../middleware/authorizeRole';

const router = Router();

// Trước đây dùng authorizeCustomer
// Bây giờ dùng authorizeRoles nếu muốn admin + telesale
router.get('/my-cart', authenticateToken, authorizeRoles(['admin', 'telesale']), async (req, res) => {
  // logic của cart
  res.json({ message: 'Cart data' });
});

export default router;
