import { Router, Request, Response, NextFunction } from 'express';
import { io } from '../server';
import { getTokenController, sendMessageController } from '../controllers/zaloController';
import { fetchZaloUserDetail } from '../services/zaloService';
import UserModel from '../models/User';
import ZaloMessageModel, { IZaloMessage } from '../models/ZaloMessage';
import GuestUser, { IGuestUser } from '../models/ZaloGuestUser';
import { createMockUser } from '../utils/mockUser';
import { authenticateToken, AuthRequest } from '../middleware/authenticateJWT';
import { authorizeRoles } from '../middleware/authorizeRole';
import ZaloToken from '../models/ZaloToken';
import { createCallController } from '../controllers/zaloCallController';

const router = Router();

// Middleware parse text/plain
router.use('/webhook', (req: Request, _res: Response, next: NextFunction) => {
  if (req.is('text/*')) {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        req.body = JSON.parse(data);
      } catch {
        req.body = {};
      }
      next();
    });
  } else next();
});

// Webhook Zalo POST
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    let payload: any = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = {};
      }
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

    const profile = await fetchZaloUserDetail(userId);

    const saved = await ZaloMessageModel.create({
      userId,
      text,
      username: profile?.name ?? guest.username,
      avatar: profile?.avatar ?? guest.avatar,
      senderType: 'customer', // thêm senderType
      success: true,
      response: payload,
    });

    // Emit realtime cho admin, kèm trạng thái online
    const admins = await UserModel.find({ role: 'admin' });
    admins.forEach((a) =>
      io.to((a._id as any).toString()).emit('new_message', {
        ...saved.toObject(),
        isOnline: guest.isOnline ?? false, // thêm isOnline
      })
    );

    console.log(`💬 Saved message from userId=${userId}, username=${saved.username}`);
  } catch (err) {
    console.error('❌ Zalo webhook POST unexpected error:', err);
  }
});

// Các route khác
router.get('/token', getTokenController);
router.post('/send', authenticateToken, sendMessageController);

// Conversations – gom theo userId

router.get(
  '/conversations',
  authenticateToken,
  authorizeRoles(['admin', 'telesale']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      let messagesQuery: IZaloMessage[] = [];

      if (user.role === 'admin') {
        messagesQuery = await ZaloMessageModel.find().sort({ sentAt: 1 }).lean();
      } else {
        messagesQuery = await ZaloMessageModel.find({ assignedTelesale: user.id })
          .sort({ sentAt: 1 })
          .lean();
      }

      const conversations: Record<string, { userId: string; messages: IZaloMessage[] }> = {};

      for (const msg of messagesQuery) {
        const userId =
          typeof msg.userId === 'string' ? msg.userId : (msg.userId as IGuestUser)._id.toString();

        if (!conversations[userId]) conversations[userId] = { userId, messages: [] };

        const guest = await GuestUser.findById(userId);
        const isOnline = guest?.isOnline ?? false;

        conversations[userId].messages.push({ ...msg, isOnline } as any);
      }

      // 🆕 Bổ sung thêm phần lấy thông tin user (username, avatar, isOnline)
      const enrichedConversations = await Promise.all(
        Object.values(conversations).map(async (conv) => {
          const guest = await GuestUser.findById(conv.userId).lean();
          const latestMessage =
            conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;

          return {
            userId: conv.userId,
            username: guest?.username || 'Khách hàng',
            avatar:
              guest?.avatar ||
              'https://ui-avatars.com/api/?name=Guest&background=random',
            isOnline: guest?.isOnline ?? false,
            assignedTelesale: guest?.assignedTelesale || null,
            lastMessage: latestMessage?.text || '',
            lastSentAt: latestMessage?.sentAt || latestMessage?.createdAt,
            messages: conv.messages,
          };
        })
      );

      // Sắp xếp theo thời gian gần nhất
      enrichedConversations.sort(
        (a, b) =>
          new Date(b.lastSentAt ?? 0).getTime() - new Date(a.lastSentAt ?? 0).getTime()
      );

      res.json(enrichedConversations);
    } catch (err: any) {
      console.error('❌ /conversations error:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

//
router.post(
  '/assign-conversation',
  authenticateToken,
  authorizeRoles(['admin']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId, telesaleId } = req.body;

      if (!userId || !telesaleId) {
        res.status(400).json({ success: false, message: 'Thiếu userId hoặc telesaleId' });
        return;
      }

      const result = await ZaloMessageModel.updateMany(
        { userId },
        { $set: { assignedTelesale: telesaleId } }
      );

      io.to(telesaleId).emit('assigned_conversation', { userId, telesaleId });

      res.json({ success: true, message: `Đã assign ${result.modifiedCount} tin nhắn`, userId });
    } catch (err: any) {
      console.error('❌ /assign-conversation error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);


// Assign telesale (admin only)
router.post(
  '/assign-telesale',
  authenticateToken,
  authorizeRoles(['admin']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { messageId, telesaleId } = req.body;

      if (!messageId || !telesaleId) {
        res.status(400).json({ success: false, message: 'Thiếu messageId hoặc telesaleId' });
        return;
      }

      // Kiểm tra messageId hợp lệ
      if (!messageId.match(/^[0-9a-fA-F]{24}$/)) {
        res.status(400).json({
          success: false,
          message: 'messageId không hợp lệ (phải là ObjectId MongoDB)',
        });
        return;
      }

      const updated = await ZaloMessageModel.findByIdAndUpdate(
        messageId,
        { assignedTelesale: telesaleId },
        { new: true }
      );

      if (!updated) {
        res.status(404).json({ success: false, message: 'Không tìm thấy message để assign' });
        return;
      }

      io.to(telesaleId).emit('assigned_message', updated);

      res.json({ success: true, message: 'Assign telesale thành công', updated });
    } catch (err: any) {
      console.error('❌ /assign-telesale error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);


// Messages user
router.get('/messages/:userId', async (req, res) => {
  const { userId } = req.params;
  const role = req.query.role as 'admin' | 'telesale';
  const telesaleId = req.query.telesaleId as string;

  let query: any = { userId };
  if (role === 'telesale' && telesaleId) query.assignedTelesale = telesaleId;

  try {
    const messages = await ZaloMessageModel.find(query).sort({ sentAt: 1 }).lean();

    // thêm trạng thái online cho từng message
    const messagesWithOnline = await Promise.all(
      messages.map(async (msg) => {
        const guest = await GuestUser.findById(msg.userId);
        return { ...msg, isOnline: guest?.isOnline ?? false };
      })
    );

    res.json(messagesWithOnline);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
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
// Gọi điện thoại zalo
router.post("/call/create", async (req, res, next) => {
  console.log("🚀 Đã nhận POST /api/zalo/call/create với body:", req.body);
  next();
}, createCallController);

//kiểm tra Access Token & Refresh Token hiện tại mà backend lưu trong MongoDB
router.get('/token/latest', async (_req, res) => {
  const token = await ZaloToken.findOne().sort({ createdAt: -1 });
  res.json(token);
});

export default router;
