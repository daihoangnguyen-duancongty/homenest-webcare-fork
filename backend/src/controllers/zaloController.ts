import { Request, Response } from 'express';
import { getAccessToken, sendMessage, fetchZaloUserDetail } from '../services/zaloService';
import GuestUser from '../models/ZaloGuestUser';
import ZaloMessageModel from '../models/ZaloMessage';
import { io } from '../server';
import { RequestHandler } from 'express';
import UserModel from '../models/User';
import { createMockUser } from '../utils/mockUser';

interface UserProfile {
  name: string;
  avatar: string | null;
}

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 phút

// Kiểm tra Access token khi server khởi động
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

    const sender = (req as any).user;
    if (!sender?.id) {
      res.status(401).json({ error: 'Không xác định được người gửi' });
      return;
    }

    const senderUser = await UserModel.findById(sender.id).lean();
    if (!senderUser) {
      res.status(404).json({ error: 'Không tìm thấy user trong hệ thống' });
      return;
    }

    const senderUsername = senderUser.username;
    const senderAvatar =
      senderUser.avatar?.path ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(senderUsername)}&background=random`;
    const senderRole = senderUser.role;

    // Upsert guest mock và cập nhật lastInteraction
    const guest = await GuestUser.findOneAndUpdate(
      { _id: userId },
      {
        $setOnInsert: createMockUser(userId),
        $set: { lastInteraction: new Date() },
      },
      { upsert: true, new: true }
    );

    // Gửi tin nhắn tới OA
    const result = await sendMessage(userId, text);

    // Lưu tin nhắn
    const saved = await ZaloMessageModel.create({
      userId,
      text,
      senderType: senderRole,
      username: senderUsername,
      avatar: senderAvatar,
      success: result?.error === 0,
      response: result,
      sentAt: new Date(),
      read: true,
    });

    const isOnline = guest.lastInteraction
      ? Date.now() - guest.lastInteraction.getTime() < ONLINE_THRESHOLD_MS
      : false;

    io.to(userId).emit('new_message', { ...saved.toObject(), isOnline });

    console.log(`📤 ${senderRole} ${senderUsername} gửi tin nhắn tới userId=${userId}`);

    res.status(200).json({ success: true, message: saved });
  } catch (err: any) {
    console.error('❌ sendMessageController error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Webhook nhận tin nhắn
export const zaloWebhookController: RequestHandler = async (req, res) => {
  try {
    let payload: any = req.body;
    if (typeof payload === 'string') payload = JSON.parse(payload);

    res.status(200).send('OK'); // trả 200 ngay

    const senderId = payload?.sender?.id ?? payload?.user?.id;
    if (!senderId) return;

    // Upsert guest mock và cập nhật lastInteraction
    const guest = await GuestUser.findOneAndUpdate(
      { _id: senderId },
      {
        $setOnInsert: createMockUser(senderId),
        $set: { lastInteraction: new Date() },
      },
      { upsert: true, new: true }
    );

    // Fetch profile thật từ Zalo
    let profile: UserProfile = { name: guest.username, avatar: guest.avatar ?? null };
    try {
      const p = await fetchZaloUserDetail(senderId);
      if (p) {
        profile = { name: p.name, avatar: p.avatar ?? null };
        await GuestUser.findOneAndUpdate(
          { _id: senderId },
          { $set: { username: profile.name, avatar: profile.avatar } },
          { upsert: true }
        );
      }
    } catch (err) {
      console.warn('⚠️ Fetch profile OA failed, fallback mock:', err);
    }

    // Lưu từng tin nhắn
    const messages: Array<{
      message?: string;
      time?: number;
      from_display_name?: string;
      from_avatar?: string;
    }> = payload?.data ?? [{ message: payload?.message?.text ?? '[no text]', time: Date.now() }];

    for (const msg of messages) {
      const text = msg.message ?? '[no text]';
      const sentAt = msg.time ? new Date(msg.time) : new Date();

      const saved = await ZaloMessageModel.create({
        userId: senderId,
        text,
        username: profile.name,
        avatar: profile.avatar,
        senderType: 'customer',
        success: true,
        response: msg,
        sentAt,
        read: false,
      });

      const isOnline = guest.lastInteraction
        ? Date.now() - guest.lastInteraction.getTime() < ONLINE_THRESHOLD_MS
        : false;

      // Emit realtime cho admin
      const admins = await UserModel.find({ role: 'admin' });
      admins.forEach((a) =>
        io.to((a._id as any).toString()).emit('new_message', {
          ...saved.toObject(),
          isOnline,
        })
      );
    }

    console.log(`💬 Saved ${messages.length} message(s) from userId=${senderId}`);
  } catch (err) {
    console.error('❌ Zalo webhook POST unexpected error:', err);
  }
};
