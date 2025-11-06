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
       return
    }

    const sender = (req as any).user;
    if (!sender?.id) {
       res.status(401).json({ error: 'Không xác định được người gửi' });
       return
    }

    const senderUser = await UserModel.findById(sender.id);
   if (!senderUser) {
  res.status(404).json({ error: 'Không tìm thấy user' });
  return; // <-- chỉ return void
}

    const senderUsername = senderUser.username;
    const senderAvatar =
      senderUser.avatar?.path ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(senderUsername)}&background=random`;
    const senderRole = senderUser.role;

    // === 1️⃣ Fetch profile Zalo khách (async, không block realtime) ===
    let profile: any = null;
    try {
      profile = await fetchZaloUserDetail(userId);
    } catch (err) {
      console.warn('⚠️ Fetch profile Zalo thất bại, dùng mock:', err);
    }

    // === 2️⃣ Upsert guest user với thông tin profile nếu có, cập nhật lastInteraction ===
    const guest = await GuestUser.findOneAndUpdate(
      { _id: userId },
      {
        $setOnInsert: {
          username: profile?.display_name ?? 'Khách hàng',
          avatar: profile?.avatar ?? null,
          email: `${userId}@zalo.local`,
          createdAt: new Date(),
        },
        $set: { lastInteraction: new Date() },
      },
      { new: true, upsert: true }
    );

    // === 3️⃣ Gửi tin nhắn tới OA ===
    const result = await sendMessage(userId, text);

    // === 4️⃣ Lưu tin nhắn vào DB ===
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

    // === 5️⃣ Emit realtime NGAY ===
    const isOnline =
      guest.lastInteraction &&
      Date.now() - new Date(guest.lastInteraction).getTime() < ONLINE_THRESHOLD_MS;

    // Emit cho khách (nếu có socket)
    io.to(userId).emit('new_message', { ...saved.toObject(), isOnline });

    // Emit cho admin
    const admins = await UserModel.find({ role: 'admin' });
    admins.forEach((a) =>
      io.to((a._id as any).toString()).emit('new_message', { ...saved.toObject(), isOnline })
    );

    // Emit cho telesale nếu guest được assign
    if (guest.assignedTelesale) {
      io.to(guest.assignedTelesale.toString()).emit('new_message', {
        ...saved.toObject(),
        isOnline,
      });
    }

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

    // === 1️⃣ Lấy profile thật từ Zalo, retry tối đa 3 lần ===
    let profile: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        profile = await fetchZaloUserDetail(senderId);
        if (profile?.display_name) break;
      } catch (err: any) {
  console.warn(`⚠️ Thử lần ${attempt} lấy profile Zalo cho ${senderId} thất bại:`, err.message);
}

      await new Promise((r) => setTimeout(r, 500 * attempt)); // delay tăng dần
    }

    if (!profile) {
      console.error(`❌ Không thể lấy thông tin thật từ Zalo cho userId=${senderId}`);
      return;
    }

    // === 2️⃣ Upsert GuestUser với dữ liệu thật ===
    let guest = await GuestUser.findOneAndUpdate(
      { _id: senderId },
      {
        $set: {
          username: profile.display_name,
          avatar: profile.avatar ?? null,
          email: `${senderId}@zalo.local`,
          lastInteraction: new Date(),
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { new: true, upsert: true }
    );

    if (!guest) {
      console.error('❌ Không thể tạo hoặc cập nhật guest user với profile thật');
      return;
    }

    const isOnline =
      guest.lastInteraction &&
      Date.now() - new Date(guest.lastInteraction).getTime() < ONLINE_THRESHOLD_MS;

    // === 3️⃣ Lấy tin nhắn từ payload ===
    const messages: Array<any> =
      payload?.data ?? [{ message: payload?.message?.text ?? '[no text]', time: Date.now() }];

    // === 4️⃣ Lưu từng tin nhắn và emit realtime NGAY ===
    for (const msg of messages) {
      const text = msg.message ?? '[no text]';
      const sentAt = msg.time ? new Date(msg.time) : new Date();

      const saved = await ZaloMessageModel.create({
        userId: senderId,
        text,
        username: guest.username,
        avatar: guest.avatar ?? null,
        senderType: 'customer',
        success: true,
        response: msg,
        sentAt,
        read: false,
      });

      // Emit realtime cho admin
      const admins = await UserModel.find({ role: 'admin' });
      admins.forEach((a) =>
        io.to((a._id as any).toString()).emit('new_message', { ...saved.toObject(), isOnline })
      );

      // Emit realtime cho telesale nếu guest được assign
      if (guest.assignedTelesale) {
        io.to(guest.assignedTelesale.toString()).emit('new_message', {
          ...saved.toObject(),
          isOnline,
        });
      }
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
