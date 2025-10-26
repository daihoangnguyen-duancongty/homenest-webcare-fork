import { Router, Request, Response, NextFunction } from 'express';
import { io } from '../server';
import { getTokenController, sendMessageController } from '../controllers/zaloController';
import { fetchZaloUserProfile } from '../services/zaloService';
import UserModel from '../models/User';
import ZaloMessageModel from '../models/ZaloMessage';
import GuestUser from '../models/ZaloGuestUser';
import { createMockUser } from '../utils/mockUser';
import { authenticateToken, AuthRequest } from '../middleware/authenticateJWT';
import { authorizeRoles } from '../middleware/authorizeRole';

const router = Router();

// Middleware parse text/plain
router.use('/webhook', (req: Request, _res: Response, next: NextFunction) => {
  if (req.is('text/*')) {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try { req.body = JSON.parse(data); } catch { req.body = {}; }
      next();
    });
  } else next();
});

// Webhook Zalo POST
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    let payload: any = req.body;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch { payload = {}; }
    }

    console.log('📥 Zalo webhook payload:', payload);

    res.status(200).send('OK'); // trả 200 ngay

    const sender = payload?.sender ?? payload?.user ?? null;
    if (!sender?.id) return;

    const userId = sender.id;
    const text = payload?.message?.text ?? '[no text]';

    // Upsert GuestUser với mock nếu chưa có
    const guestData = createMockUser(userId);
    const guest = await GuestUser.findOneAndUpdate(
      { _id: userId },
      { $setOnInsert: guestData },
      { upsert: true, new: true }
    );

    const profile = await fetchZaloUserProfile(userId);

    const saved = await ZaloMessageModel.create({
      userId,
      text,
      username: profile?.name ?? guest.username,
      avatar: profile?.avatar ?? guest.avatar,
      success: true,
      response: payload,
    });

    // Emit realtime cho admin
    const admins = await UserModel.find({ role: 'admin' });
    admins.forEach(a => io.to((a._id as any).toString()).emit('new_message', saved));

    console.log(`💬 Saved message from userId=${userId}, username=${saved.username}`);
  } catch (err) {
    console.error('❌ Zalo webhook POST unexpected error:', err);
  }
});

// Các route khác
router.get('/token', getTokenController);
router.post('/send', sendMessageController);

// Conversations
router.get(
  "/conversations",
  authenticateToken,
  authorizeRoles(["admin", "telesale"]),
  async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    let messages;
    if (user.role === "admin") {
      messages = await ZaloMessageModel.find().sort({ sentAt: -1 });
    } else {
      messages = await ZaloMessageModel.find({ assignedTelesale: user.id }).sort({ sentAt: -1 });
    }
    res.json(messages);
  }
);

// Assign telesale (admin only)
router.post(
  "/assign-telesale",
  authenticateToken,
  authorizeRoles(["admin"]),
  async (req, res) => {
    const { messageId, telesaleId } = req.body;
    const updated = await ZaloMessageModel.findByIdAndUpdate(
      messageId,
      { assignedTelesale: telesaleId },
      { new: true }
    );
    if (updated) io.to(telesaleId).emit("assigned_message", updated);
    res.json(updated);
  }
);
// Messages user
router.get('/messages/:userId', async (req, res) => {
  const { userId } = req.params;
  const role = req.query.role as 'admin' | 'telesale';
  const telesaleId = req.query.telesaleId as string;

  const query: any = { userId };
  if (role === 'telesale') query.assignedTelesale = telesaleId;

  const messages = await ZaloMessageModel.find(query).sort({ sentAt: 1 });
  res.json(messages);
});



// List telesales
router.get('/telesales', async (req, res) => {
  try {
    const telesales = await UserModel.find({ role: 'telesale' }).select('id username email phone');
    res.json(telesales);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
