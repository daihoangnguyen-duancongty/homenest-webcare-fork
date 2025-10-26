import { Request, Response } from 'express';
import { getAccessToken, sendMessage, fetchZaloUserProfile } from '../services/zaloService';
import GuestUser from '../models/ZaloGuestUser';
import ZaloMessageModel from '../models/ZaloMessage';
import { io } from '../server';
import { RequestHandler } from 'express';
import { createMockUser } from '../utils/mockUser';

// Kiểm tra Access token đã có
(async () => {
  try {
    const token = await getAccessToken();
    console.log('✅ Access Token OA:', token);
  } catch (err) {
    console.error('❌ Lỗi khi lấy access token:', err);
  }
})();

// Lấy token
export const getTokenController = async (req: Request, res: Response) => {
  try {
    const token = await getAccessToken();

    await GuestUser.findOneAndUpdate(
      { _id: 'system' },
      { $setOnInsert: { username: 'System Bot', email: 'system@zalo.local' } },
      { upsert: true }
    );

    await ZaloMessageModel.create({
      userId: 'system',
      text: 'Get Access Token',
      success: true,
      response: { token },
    });

    res.status(200).json({ access_token: token });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Gửi tin nhắn
export const sendMessageController: RequestHandler = async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!userId || !text) {
      res.status(400).json({ error: 'userId và text là bắt buộc' });
      return;
    }

    const guestData = createMockUser(userId);
    const guest = await GuestUser.findOneAndUpdate(
      { _id: userId },
      { $setOnInsert: guestData },
      { upsert: true, new: true }
    );

    const result = await sendMessage(userId, text);

    const saved = await ZaloMessageModel.create({
      userId,
      text,
      success: result?.error === 0,
      response: result,
      username: guest.username,
      avatar: guest.avatar,
    });

    io.to(userId).emit('new_message', saved);
    res.status(200).json({ success: true, result, saved });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Webhook nhận tin nhắn
export const zaloWebhookController = async (req: Request, res: Response) => {
  try {
    let payload: any = req.body;
    if (typeof payload === 'string') payload = JSON.parse(payload);

    const sender = payload?.sender ?? payload?.user;
    const senderId = sender?.id;
    const text = payload?.message?.text ?? '[no text]';

    if (!senderId) {
      return res.status(200).json({ success: false, reason: 'Missing sender.id' });
    }

    // Upsert GuestUser mock
    const guest = await GuestUser.findOneAndUpdate(
      { _id: senderId },
      {
        $setOnInsert: {
          username: `ZaloUser-${senderId}`,
          email: `${senderId}@zalo.local`,
          avatar: null,
        },
      },
      { upsert: true, new: true }
    );

    // Fetch profile thật từ OA nếu có refresh token
    let profile = await fetchZaloUserProfile(senderId);

    // Lưu tin nhắn, ưu tiên: Postman payload > profile OA > guest mock
    const saved = await ZaloMessageModel.create({
      userId: senderId,
      text,
      username: sender?.name ?? profile?.name ?? guest.username,
      avatar: sender?.avatar ?? profile?.avatar ?? guest.avatar,
      success: true,
      response: payload,
    });

    console.log(`💬 Saved message from userId=${senderId}, username=${saved.username}`);

    // Emit realtime cho admin (CRM users)
    const admins = await GuestUser.find({ role: 'admin' }); // hoặc UserModel nếu muốn admin thật
    admins.forEach((a) => io.to((a._id as any).toString()).emit('new_message', saved));

    // Trả về 200 OK ngay
    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('❌ Zalo webhook POST error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
