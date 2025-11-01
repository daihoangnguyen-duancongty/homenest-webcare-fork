import { Request, Response } from "express";
import axios from "axios";
import CallLog from "../models/ZaloCall";
import { getAccessToken } from "../services/zaloService";
import { io } from "../server";
import GuestUser from "../models/ZaloGuestUser";
import UserModel from "../models/User"
import { callViaStringee } from "../utils/callViaStringee";
import { createStringeeToken } from "../utils/stringeeToken";
// import { pushIncomingCall } from "../utils/pushFCM";
import User from "../models/User";



const ONLINE_THRESHOLD_MS = 30 * 60 * 1000; // 30 phút

// ==========================
// 📞 GỌI TỪ CRM → KHÁCH HÀNG
// ==========================
export const createCallController = async (req: Request, res: Response): Promise<void> => {
  console.log("🎯 Bắt đầu xử lý createCallController");

  try {
    const { userId } = req.body; // đây là Mongo _id từ frontend
    const telesale = (req as any).user;
    console.log("📦 userId (Mongo _id):", userId, "| telesale:", telesale?._id || "system");

    if (!userId) {
      console.warn("⚠️ Thiếu userId trong body");
      res.status(400).json({ success: false, message: "Thiếu userId" });
      return;
    }

    // 🔹 Lấy guest để lấy zaloId
    const guest: any = await GuestUser.findById(userId);
if (!guest?.zaloId) {
  console.warn("⚠️ Guest chưa có zaloId, tự set zaloId bằng _id");
  guest.zaloId = guest._id;
  await guest.save();
}


console.log(`📞 Gọi API Zalo với user_id: ${guest.zaloId}`);

    console.log("🔑 Đang lấy access token...");
    const token = await getAccessToken();
    console.log("✅ Access token lấy được:", token?.slice(0, 20) + "...");

    console.log(`📞 Gọi API Zalo với user_id: ${guest.zaloId}`);
    const zaloRes = await axios.post(
      "https://openapi.zalo.me/v3.0/oa/call/outbound",
      { user_id: guest.zaloId, call_type: "audio" }, // <-- dùng zaloId
      {
        headers: {
          access_token: token,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    console.log("📡 Zalo trả về:", zaloRes.data);
    const data = zaloRes.data;
    if (data.error !== 0) {
      console.error("❌ Lỗi từ Zalo API:", data);
      throw new Error(data.message || "Zalo API lỗi khi tạo cuộc gọi");
    }

    const callLink = data.data.call_link;
    console.log("🔗 Call link:", callLink);

    console.log("💾 Đang ghi log vào DB...");
    const call = await CallLog.create({
      caller: telesale?._id || "system",
      callee: userId,
      callLink,
      status: "pending",
    });
    console.log("✅ Đã ghi call log:", call._id);

    console.log("📡 Emit sự kiện new_call...");
    io.emit("incoming_call", {
      callId: call._id,
      telesaleName: telesale?.name || "Hệ thống OA",
      userId,
      callLink,
      status: "Đang gọi...",
      createdAt: call.createdAt,
    });

    console.log("🎉 Hoàn tất createCallController!");
    res.json({ success: true, callLink });
  } catch (err: any) {
    console.error("💥 /zalo/call/create error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
// ==========================
// 📞 GỌI TỪ KHÁCH HÀNG → CRM
// ==========================
export const inboundCallController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zaloUserId } = req.body;
    if (!zaloUserId) {
      res.status(400).json({ success: false, message: "Thiếu zaloUserId" });
      return;
    }

    const guestId = `zalo_${zaloUserId}`;
    console.log("📞 Inbound call from:", guestId);

    // Tìm telesale online
    const now = new Date();
    const telesale = await User.findOne({
      role: "telesale",
      lastInteraction: { $gte: new Date(now.getTime() - ONLINE_THRESHOLD_MS) },
    });

    if (!telesale) {
      console.warn("⚠️ Không có telesale online");
      res.status(404).json({ message: "Không có telesale online" });
      return;
    }

    // ✅ Tạo token Stringee cho telesale
    const telesaleUserId = telesale.stringeeUserId || telesale._id.toString();
    const token = createStringeeToken(telesaleUserId);

    console.log("📡 Calling Stringee:", { from: guestId, to: telesaleUserId });

    // ✅ Gọi Stringee với payload chuẩn
    const callResult = await callViaStringee(guestId, telesaleUserId, token);

    // 🔗 Lấy callLink an toàn
    const callLink =
      callResult?.call_link ||
      `https://admin.stringee.com/call/${callResult?.call_id || "unknown"}`;

    // 💾 Lưu CallLog
    const callLog = await CallLog.create({
      caller: guestId,
      callee: telesale._id.toString(),
      callLink,
      status: "pending",
      startedAt: new Date(),
    });

    console.log("✅ CallLog inbound saved:", callLog._id, "CallLink:", callLink);

    // 📡 Emit realtime event
    io.emit("incoming_call", {
      callId: callLog._id,
      telesaleName: telesale.username || "Telesale",
      from: guestId,
      to: telesale._id,
      status: "Đang gọi...",
      createdAt: callLog.createdAt,
      callLink,
    });

    res.json({ success: true, callId: callLog._id, callLink, callResult });
  } catch (error: any) {
    console.error(
      "💥 inboundCallController error:",
      error.response?.data || error.message
    );
    res.status(500).json({ success: false, message: error.message });
  }
};
