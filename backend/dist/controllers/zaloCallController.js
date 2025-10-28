"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inboundCallController = exports.createCallController = void 0;
const axios_1 = __importDefault(require("axios"));
const ZaloCall_1 = __importDefault(require("../models/ZaloCall"));
const zaloService_1 = require("../services/zaloService");
const server_1 = require("../server");
const ZaloGuestUser_1 = __importDefault(require("../models/ZaloGuestUser"));
const User_1 = __importDefault(require("../models/User"));
// ==========================
// 📞 GỌI TỪ CRM → KHÁCH HÀNG
// ==========================
const createCallController = async (req, res) => {
    console.log("🎯 Bắt đầu xử lý createCallController");
    try {
        const { userId } = req.body; // đây là Mongo _id từ frontend
        const telesale = req.user;
        console.log("📦 userId (Mongo _id):", userId, "| telesale:", telesale?._id || "system");
        if (!userId) {
            console.warn("⚠️ Thiếu userId trong body");
            res.status(400).json({ success: false, message: "Thiếu userId" });
            return;
        }
        // 🔹 Lấy guest để lấy zaloId
        const guest = await ZaloGuestUser_1.default.findById(userId);
        if (!guest?.zaloId) {
            console.warn("⚠️ Guest chưa có zaloId, tự set zaloId bằng _id");
            guest.zaloId = guest._id;
            await guest.save();
        }
        console.log(`📞 Gọi API Zalo với user_id: ${guest.zaloId}`);
        console.log("🔑 Đang lấy access token...");
        const token = await (0, zaloService_1.getAccessToken)();
        console.log("✅ Access token lấy được:", token?.slice(0, 20) + "...");
        console.log(`📞 Gọi API Zalo với user_id: ${guest.zaloId}`);
        const zaloRes = await axios_1.default.post("https://openapi.zalo.me/v3.0/oa/call/outbound", { user_id: guest.zaloId, call_type: "audio" }, // <-- dùng zaloId
        {
            headers: {
                access_token: token,
                "Content-Type": "application/json",
            },
            timeout: 10000,
        });
        console.log("📡 Zalo trả về:", zaloRes.data);
        const data = zaloRes.data;
        if (data.error !== 0) {
            console.error("❌ Lỗi từ Zalo API:", data);
            throw new Error(data.message || "Zalo API lỗi khi tạo cuộc gọi");
        }
        const callLink = data.data.call_link;
        console.log("🔗 Call link:", callLink);
        console.log("💾 Đang ghi log vào DB...");
        const call = await ZaloCall_1.default.create({
            caller: telesale?._id || "system",
            callee: userId,
            callLink,
            status: "pending",
        });
        console.log("✅ Đã ghi call log:", call._id);
        console.log("📡 Emit sự kiện new_call...");
        server_1.io.emit("incoming_call", {
            callId: call._id,
            telesaleName: telesale?.name || "Hệ thống OA",
            userId,
            callLink,
            status: "Đang gọi...",
            createdAt: call.createdAt,
        });
        console.log("🎉 Hoàn tất createCallController!");
        res.json({ success: true, callLink });
    }
    catch (err) {
        console.error("💥 /zalo/call/create error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.createCallController = createCallController;
// ==========================
// 📞 GỌI TỪ KHÁCH HÀNG → CRM
// ==========================
const inboundCallController = async (req, res) => {
    try {
        const { guestName, guestId, callLink, targetRole, targetUserId } = req.method === "GET" ? req.query : req.body;
        console.log("📞 Inbound call event received:", req.method, req.query || req.body);
        if (!guestId) {
            res.status(400).json({ success: false, message: "Thiếu guestId" });
            return;
        }
        const callData = {
            guestId,
            guestName: guestName || "Khách hàng Zalo",
            callLink: callLink || "https://zalo.me/oa/yourOAID",
            targetRole: targetRole || "admin",
            targetUserId,
        };
        if (callData.targetRole === "admin") {
            const admins = await User_1.default.find({ role: "admin" });
            admins.forEach((a) => {
                server_1.io.to(a._id.toString()).emit("inbound_call", callData);
            });
        }
        else if (callData.targetRole === "telesale" && callData.targetUserId) {
            server_1.io.to(callData.targetUserId).emit("inbound_call", callData);
        }
        console.log(`✅ Đã emit socket inbound_call tới ${callData.targetRole}`);
        res.json({ success: true, message: "Inbound call emitted", data: callData });
    }
    catch (err) {
        console.error("❌ inboundCallController error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.inboundCallController = inboundCallController;
