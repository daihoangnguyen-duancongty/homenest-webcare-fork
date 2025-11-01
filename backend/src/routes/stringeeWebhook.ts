import express, { Request, Response } from "express";
import CallLog from "../models/ZaloCall"; // bạn đã có model này
import { io } from "../server";

const router = express.Router();

// ✅ Khi Stringee GET để lấy thông tin khách hàng
router.get("/customer-info", async (req: Request, res: Response) => {
  const phone = req.query.phone as string;
  console.log("📞 Stringee yêu cầu customer info cho:", phone);

  // 🔹 Trả thông tin cơ bản
  res.json({
    name: "Khách hàng Homenest",
    phone,
    note: "Tự động trả thông tin từ CRM",
  });
});

// ✅ Khi Stringee POST sự kiện cuộc gọi (call start, answer, end,...)
router.post("/events", async (req: Request, res: Response) => {
  const event = req.body;
  console.log("📡 Nhận event từ Stringee:", JSON.stringify(event, null, 2));

  try {
    const callId = event.call_id;
    const status = event.type; // Ví dụ: 'answered', 'ended'

    // Cập nhật log nếu có
    if (callId && status) {
      await CallLog.findOneAndUpdate(
        { callId },
        { $set: { status, updatedAt: new Date() } },
        { upsert: false }
      );
      io.emit("call_event_update", { callId, status });
    }
  } catch (err) {
    console.error("❌ Lỗi xử lý event:", err);
  }

  res.status(200).send("OK");
});

// ✅ Khi khách hàng bắt máy (callout answer)
router.post("/answer", async (req: Request, res: Response) => {
  console.log("✅ Stringee báo khách đã bắt máy:", req.body);
  res.send("OK");
});

export default router;
