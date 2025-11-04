import { Request, Response } from 'express';
import CallLog from '../models/ZaloCall';
import GuestUser from '../models/ZaloGuestUser';
import User from '../models/User';
import { io } from '../server';
import { createAgoraToken } from '../utils/agoraToken';
import { FRONTEND_URL } from '../config/fetchConfig';

const ONLINE_THRESHOLD_MS = 30 * 60 * 1000; // 30 phút

// 📞 Outbound call: Telesale gọi khách
export const createCallController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { guestId } = req.body;
    const telesale = (req as any).user;

    if (!guestId) {
      res.status(400).json({ success: false, message: 'Thiếu guestId' });
      return;
    }

    const guest = await GuestUser.findById(guestId);
    if (!guest) {
      res.status(404).json({ success: false, message: 'Không tìm thấy khách' });
      return;
    }

    const guestAgoraId = (guest as any).zaloId || guest._id.toString();
    const telesaleAgoraId = telesale.id;

    const channelName = `call_${Date.now()}_${telesaleAgoraId}_${guestAgoraId}`;
    const telesaleToken = createAgoraToken(channelName, telesaleAgoraId);
    const guestToken = createAgoraToken(channelName, guestAgoraId);

    const callLink = `${FRONTEND_URL}/call/${channelName}`;

    const callLog = await CallLog.create({
      caller: telesale.id,
      callee: guest._id,
      channelName,
      callLink,
      status: 'pending',
      direction: 'outbound',
      platform: 'agora',
      startedAt: new Date(),
    });

    io.emit(`incoming_call_${guestAgoraId}`, {
      callId: callLog._id,
      from: telesale.id,
      telesaleName: telesale.username || 'Telesale',
      channelName,
      guestToken,
      telesaleToken,
      appId: process.env.AGORA_APP_ID,
      status: 'Telesale đang gọi bạn...',
      createdAt: callLog.createdAt,
    });

    // ✅ Trả thêm Agora UID cho frontend
    res.json({
      success: true,
      callId: callLog._id,
      channelName,
      guestToken,
      telesaleToken,
      appId: process.env.AGORA_APP_ID,
      guestAgoraId,
      telesaleAgoraId,
    });
  } catch (err: any) {
    console.error('💥 createCallController Agora error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// 📞 Inbound call: Khách gọi vào CRM
export const inboundCallController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zaloUserId } = req.body;
    if (!zaloUserId) {
      res.status(400).json({ success: false, message: 'Thiếu zaloUserId' });
      return;
    }

    // Lấy hoặc tạo GuestUser
    let guest = await GuestUser.findOne({ zaloId: zaloUserId });
    if (!guest) {
      guest = await GuestUser.create({
        zaloId: zaloUserId,
        name: `ZaloUser_${zaloUserId}`,
      });
    }

    const guestAgoraId = (guest as any).zaloId;
    const channelName = `call_${Date.now()}_${guestAgoraId}`;

    // Tìm telesale online
    const now = new Date();
    const telesale = await User.findOne({
      role: 'telesale',
      lastInteraction: { $gte: new Date(now.getTime() - ONLINE_THRESHOLD_MS) },
    });

    if (!telesale) {
      res.status(404).json({ success: false, message: 'Không có telesale online' });
      return;
    }

    const telesaleAgoraId = telesale._id.toString();

    const guestToken = createAgoraToken(channelName, guestAgoraId);
    const telesaleToken = createAgoraToken(channelName, telesaleAgoraId);

    // Lưu log
    const callLog = await CallLog.create({
      caller: guest._id,
      callee: telesale._id,
      channelName,
      status: 'pending',
      direction: 'inbound',
      platform: 'agora',
      startedAt: new Date(),
    });

    io.emit('incoming_call', {
      callId: callLog._id,
      telesaleId: telesale._id,
      from: guest._id,
      channelName,
      guestToken,
      telesaleToken,
      appId: process.env.AGORA_APP_ID,
      status: 'Khách đang gọi...',
      createdAt: callLog.createdAt,
    });

    res.json({
      success: true,
      callId: callLog._id,
      channelName,
      guestToken,
      telesaleToken,
      appId: process.env.AGORA_APP_ID,
    });
  } catch (err: any) {
    console.error('💥 inboundCallController error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
