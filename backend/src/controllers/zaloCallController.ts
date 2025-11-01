import { Request, Response } from "express";
import CallLog from "../models/ZaloCall";
import GuestUser from "../models/ZaloGuestUser";
import User from "../models/User";
import { io } from "../server";
import { createAgoraToken } from "../utils/agoraToken";

const ONLINE_THRESHOLD_MS = 30 * 60 * 1000; // 30 phút

// 📞 GỌI TỪ TELESALE → KHÁCH (Outbound Agora)

export const createCallController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { guestId } = req.body; // Mongo _id của khách
    const telesale = (req as any).user; // user đã login qua middleware
    if (!guestId) {
      res.status(400).json({ success: false, message: "Thiếu guestId" });
      return;
    }

    // 🔹 Lấy thông tin khách
    const guest = await GuestUser.findById(guestId);
    if (!guest) {
      res.status(404).json({ success: false, message: "Không tìm thấy khách" });
      return;
    }

    const guestAgoraId = (guest as any).zaloId || guest._id.toString();
    const telesaleAgoraId = telesale._id.toString();

    // 🔹 Tạo channel và token Agora
    const channelName = `call_${Date.now()}_${telesaleAgoraId}_${guestAgoraId}`;
    const telesaleToken = createAgoraToken(channelName, telesaleAgoraId);
    const guestToken = createAgoraToken(channelName, guestAgoraId);

    // 💾 Lưu log
    const callLog = await CallLog.create({
      caller: telesale._id,
      callee: guest._id,
      channelName,
      status: "pending",
      direction: "outbound",
      platform: "agora",
      startedAt: new Date(),
    });

    console.log("✅ Outbound callLog created:", callLog._id);

    // 📡 Emit realtime đến app khách (qua socket hoặc OA nếu có)
    io.emit(`incoming_call_${guestAgoraId}`, {
      callId: callLog._id,
      from: telesale._id,
      telesaleName: telesale.name || "Telesale",
      channelName,
      guestToken,
      telesaleToken,
      appId: process.env.AGORA_APP_ID,
      status: "Telesale đang gọi bạn...",
      createdAt: callLog.createdAt,
    });

    // ✅ Trả về cho frontend CRM
    res.json({
      success: true,
      callId: callLog._id,
      channelName,
      guestToken,
      telesaleToken,
      appId: process.env.AGORA_APP_ID,
    });
  } catch (err: any) {
    console.error("💥 createCallController Agora error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================
// 📞 GỌI TỪ KHÁCH HÀNG → CRM (Inbound Agora)
// ==========================
export const inboundCallController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zaloUserId } = req.body;
    if (!zaloUserId) {
      res.status(400).json({ success: false, message: "Thiếu zaloUserId" });
      return;
    }

    // 🔹 Kiểm tra hoặc tạo GuestUser
    let guest = await GuestUser.findOne({ zaloId: zaloUserId });
    if (!guest) {
      guest = await GuestUser.create({
        zaloId: zaloUserId,
        name: `ZaloUser_${zaloUserId}`,
      });
      console.log("🆕 Tạo guest mới:", guest._id);
    }

   const guestAgoraId = (guest as any).zaloId;
    const channelName = `call_${Date.now()}_${guestAgoraId}`;

    // 🔹 Tìm telesale online
    const now = new Date();
    const telesale = await User.findOne({
      role: "telesale",
      lastInteraction: { $gte: new Date(now.getTime() - ONLINE_THRESHOLD_MS) },
    });

    if (!telesale) {
      console.warn("⚠️ Không có telesale online");
      res.status(404).json({ success: false, message: "Không có telesale online" });
      return;
    }

    const telesaleAgoraId = telesale._id.toString();

    // 🔹 Tạo token Agora cho cả hai bên
    const guestToken = createAgoraToken(channelName, guestAgoraId);
    const telesaleToken = createAgoraToken(channelName, telesaleAgoraId);

    // 💾 Ghi log
    const callLog = await CallLog.create({
      caller: guest._id,
      callee: telesale._id,
      channelName,
      status: "pending",
      direction: "inbound",
      platform: "agora",
      startedAt: new Date(),
    });

    console.log("✅ CallLog inbound saved:", callLog._id);
const telesaleName = (telesale as any).name || "Telesale";
    // 📡 Gửi sự kiện realtime đến CRM (telesale)
    io.emit("incoming_call", {
      callId: callLog._id,
      telesaleId: telesale._id,

      from: guest._id,
      channelName,
      guestToken,
      telesaleToken,
      appId: process.env.AGORA_APP_ID,
      status: "Khách đang gọi...",
      createdAt: callLog.createdAt,
    });

    // ✅ Trả về thông tin để client (app khách) join channel
    res.json({
      success: true,
      callId: callLog._id,
      channelName,
      guestToken,
      telesaleToken,
      appId: process.env.AGORA_APP_ID,
    });
  } catch (error: any) {
    console.error("💥 inboundCallController error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
