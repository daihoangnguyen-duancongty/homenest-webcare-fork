import express, { Request, Response } from "express";
import { createAgoraToken } from "../utils/agoraToken";
import CallLog from "../models/ZaloCall";
import { io } from "../server"; // Socket.IO instance

const router = express.Router();

router.post("/call", async (req: Request, res: Response) => {
  try {
    const { telesaleId, guestId } = req.body;

    const channel = `call_${telesaleId}_${guestId}_${Date.now()}`;
    const telesaleToken = createAgoraToken(channel, telesaleId);
    const guestToken = createAgoraToken(channel, guestId);

    // Lưu log cuộc gọi
    const call = await CallLog.create({
      telesale: telesaleId,
      guest: guestId,
      startTime: new Date(),
      status: "calling",
      channel,
      provider: "Agora",
    });

    // Thông báo real-time qua socket
    io.emit("call:initiate", { telesaleId, guestId, channel });

    res.json({
      success: true,
      appId: process.env.AGORA_APP_ID,
      channel,
      telesaleToken,
      guestToken,
    });
  } catch (error) {
    console.error("Error creating Agora call:", error);
    res.status(500).json({ success: false, message: "Failed to start call" });
  }
});

export default router;
