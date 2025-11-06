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

const profile = await fetchZaloUserDetail(userId);

await GuestUser.updateOne(
  { _id: userId },
  {
    $set: {
      username: profile?.display_name ?? 'Khách hàng',
      avatar: profile?.avatar ?? null,
      email: `${userId}@zalo.local`,
      lastInteraction: new Date(),
    },
    $setOnInsert: {
      createdAt: new Date(),
    },
  },
  { upsert: true }
);

const guest = await GuestUser.findById(userId).lean();


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

    const isOnline = guest?.lastInteraction
  ? Date.now() - new Date(guest.lastInteraction).getTime() < ONLINE_THRESHOLD_MS
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

    // Trả về 200 ngay để Zalo không timeout
    res.status(200).send('OK');

    const senderId = payload?.sender?.id ?? payload?.user?.id;
    if (!senderId) return;


// === [1] Lấy profile Zalo thật, retry tối đa 3 lần nếu thất bại ===
let profile = null;
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    profile = await fetchZaloUserDetail(senderId);
    if (profile?.display_name) break; // ✅ Có thông tin thật thì thoát vòng lặp
  } catch (err) {
    console.warn(`⚠️ Thử lần ${attempt} lấy profile Zalo cho ${senderId} thất bại:`, err.message);
  }
  await new Promise((r) => setTimeout(r, 500 * attempt)); // ⏳ chờ tăng dần 0.5s, 1s, 1.5s
}

if (!profile) {
  console.error(`❌ Không thể lấy thông tin thật từ Zalo cho userId=${senderId}`);
  return; // ❗Nếu vẫn thất bại thì không lưu tin (bảo đảm dữ liệu luôn đúng)
}

// === [2] Tạo hoặc cập nhật GuestUser với profile thật ===
await GuestUser.updateOne(
  { _id: senderId },
  {
    $set: {
      username: profile.display_name,
      avatar: profile.avatar ?? null,
      email: `${senderId}@zalo.local`,
      lastInteraction: new Date(),
      updatedAt: new Date(),
    },
    $setOnInsert: {
      createdAt: new Date(),
    },
  },
  { upsert: true }
);


    // Lấy lại thông tin guest sau khi upsert
    const guest = await GuestUser.findById(senderId).lean();
    const profileName = guest?.username ?? profile.display_name;
    const profileAvatar = guest?.avatar ?? profile.avatar ?? null;

    // === [3] Lưu tin nhắn từ payload ===
    const messages: Array<{
      message?: string;
      time?: number;
      from_display_name?: string;
      from_avatar?: string;
    }> =
      payload?.data ??
      [{ message: payload?.message?.text ?? '[no text]', time: Date.now() }];

    for (const msg of messages) {
      const text = msg.message ?? '[no text]';
      const sentAt = msg.time ? new Date(msg.time) : new Date();

      const saved = await ZaloMessageModel.create({
        userId: senderId,
        text,
        username: profileName,
        avatar: profileAvatar,
        senderType: 'customer',
        success: true,
        response: msg,
        sentAt,
        read: false,
      });

      const isOnline =
        guest?.lastInteraction &&
        Date.now() - new Date(guest.lastInteraction).getTime() <
          ONLINE_THRESHOLD_MS;

      // Gửi realtime tới admin
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




 
 // 🗑️ Xóa toàn bộ tin nhắn và GuestUser
export const deleteMessagesByUser: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ success: false, message: 'Thiếu userId' });
      return;
    }

    // Xóa tin nhắn và guest user
    const [msgResult, guestResult] = await Promise.all([
      ZaloMessageModel.deleteMany({ userId }),
      GuestUser.deleteOne({ _id: userId }),
    ]);

    console.log(`🗑️ Đã xóa ${msgResult.deletedCount} tin và guestUser=${guestResult.deletedCount}`);

    res.json({
      success: true,
      message: `Đã xóa hội thoại + guestUser ${userId}`,
    });
  } catch (error: any) {
    console.error('❌ deleteMessagesByUser error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
