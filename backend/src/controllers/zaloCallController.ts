import { Request, Response } from "express";
import axios from "axios";
import CallLog from "../models/ZaloCall";
import { getAccessToken } from "../services/zaloService";
import { io } from "../server";
import GuestUser from "../models/ZaloGuestUser";

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
  console.warn("⚠️ Guest chưa có zaloId");
  res.status(400).json({ success: false, message: "Guest chưa có zaloId" });
  return;
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
