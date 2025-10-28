"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const express_1 = require("express");
const server_1 = require("../server");
const zaloController_1 = require("../controllers/zaloController");
const zaloService_1 = require("../services/zaloService");
const User_1 = __importDefault(require("../models/User"));
const ZaloMessage_1 = __importDefault(require("../models/ZaloMessage"));
const ZaloGuestUser_1 = __importDefault(require("../models/ZaloGuestUser"));
const mockUser_1 = require("../utils/mockUser");
const authenticateJWT_1 = require("../middleware/authenticateJWT");
const authorizeRole_1 = require("../middleware/authorizeRole");
const ZaloToken_1 = __importDefault(require("../models/ZaloToken"));
const zaloCallController_1 = require("../controllers/zaloCallController");
const zaloCallController_2 = require("../controllers/zaloCallController");
const zaloService_2 = require("../services/zaloService");
const router = (0, express_1.Router)();
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;
// Middleware parse text/plain
router.use('/webhook', (req, _res, next) => {
    if (req.is('text/*')) {
        let data = '';
        req.setEncoding('utf8');
        req.on('data', (chunk) => (data += chunk));
        req.on('end', () => {
            try {
                req.body = JSON.parse(data);
            }
            catch {
                req.body = {};
            }
            next();
        });
    }
    else
        next();
});
// Webhook Zalo POST
router.post('/webhook', async (req, res) => {
    try {
        let payload = req.body;
        if (typeof payload === 'string') {
            try {
                payload = JSON.parse(payload);
            }
            catch {
                payload = {};
            }
        }
        console.log('📥 Zalo webhook payload:', payload);
        res.status(200).send('OK'); // trả 200 ngay
        // xử lý cuộc gọi từ khách hàng
        if (payload?.event_name === "user_click_button" &&
            payload?.message?.button?.payload === "CALL_NOW") {
            const sender = payload?.sender || payload?.user;
            const guestId = sender?.id;
            if (!guestId)
                return;
            console.log("📞 Khách bấm 'Gọi tư vấn ngay' → tạo inbound call cho admin");
            try {
                await axios_1.default.post(`${process.env.BACKEND_URL || "https://homenest-webcare-fork-backend.onrender.com"}/api/zalo/call/inbound`, {
                    guestId,
                    guestName: "Khách hàng Zalo",
                    callLink: `https://zalo.me/oa/${process.env.ZALO_OA_ID || "2405262870078293027"}`,
                    targetRole: "admin",
                });
            }
            catch (err) {
                console.error("❌ Lỗi gọi inboundCallController:", err.message);
            }
            return; // dừng xử lý tiếp
        }
        // xử lý tinh nhắn văn bản
        const sender = payload?.sender ?? payload?.user ?? null;
        if (!sender?.id)
            return;
        const userId = sender.id;
        const text = payload?.message?.text ?? '[no text]';
        // Upsert GuestUser với mock nếu chưa có
        const guestData = (0, mockUser_1.createMockUser)(userId);
        const guest = await ZaloGuestUser_1.default.findOneAndUpdate({ _id: userId }, { $set: { lastInteraction: new Date(), zaloId: userId }, $setOnInsert: guestData }, { upsert: true, new: true });
        const profile = await (0, zaloService_1.fetchZaloUserDetail)(userId);
        const saved = await ZaloMessage_1.default.create({
            userId,
            text,
            username: profile?.name ?? guest.username,
            avatar: profile?.avatar ?? guest.avatar,
            senderType: 'customer', // thêm senderType
            success: true,
            response: payload,
        });
        // Emit realtime cho admin, kèm trạng thái online
        const admins = await User_1.default.find({ role: 'admin' });
        admins.forEach((a) => server_1.io.to(a._id.toString()).emit('new_message', {
            ...saved.toObject(),
            isOnline: guest?.lastInteraction
                ? Date.now() - guest.lastInteraction.getTime() < ONLINE_THRESHOLD_MS
                : false, // thêm isOnline
        }));
        console.log(`💬 Saved message from userId=${userId}, username=${saved.username}`);
    }
    catch (err) {
        console.error('❌ Zalo webhook POST unexpected error:', err);
    }
});
// Các route khác
router.get('/token', zaloController_1.getTokenController);
router.post('/send', authenticateJWT_1.authenticateToken, zaloController_1.sendMessageController);
// Conversations – gom theo userId
router.get('/conversations', authenticateJWT_1.authenticateToken, (0, authorizeRole_1.authorizeRoles)(['admin', 'telesale']), async (req, res) => {
    try {
        const user = req.user;
        let messagesQuery = [];
        if (user.role === 'admin') {
            messagesQuery = await ZaloMessage_1.default.find().sort({ sentAt: 1 }).lean();
        }
        else {
            messagesQuery = await ZaloMessage_1.default.find({ assignedTelesale: user.id })
                .sort({ sentAt: 1 })
                .lean();
        }
        const conversations = {};
        for (const msg of messagesQuery) {
            const userId = typeof msg.userId === 'string' ? msg.userId : msg.userId._id.toString();
            if (!conversations[userId])
                conversations[userId] = { userId, messages: [] };
            const guest = await ZaloGuestUser_1.default.findById(userId);
            const isOnline = guest?.lastInteraction
                ? Date.now() - guest.lastInteraction.getTime() < ONLINE_THRESHOLD_MS
                : false;
            conversations[userId].messages.push({ ...msg, isOnline });
        }
        // 🆕 Bổ sung thêm phần lấy thông tin user (username, avatar, isOnline)
        const enrichedConversations = await Promise.all(Object.values(conversations).map(async (conv) => {
            const guest = await ZaloGuestUser_1.default.findById(conv.userId).lean();
            const latestMessage = conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;
            // ✅ Đếm tin nhắn chưa đọc
            const unreadCount = await ZaloMessage_1.default.countDocuments({
                userId: conv.userId,
                senderType: 'customer',
                read: false,
            });
            return {
                userId: conv.userId,
                username: guest?.username || 'Khách hàng',
                avatar: guest?.avatar || 'https://ui-avatars.com/api/?name=Guest&background=random',
                isOnline: guest?.isOnline ?? false,
                assignedTelesale: guest?.assignedTelesale || null,
                lastMessage: latestMessage?.text || '',
                lastSentAt: latestMessage?.sentAt || latestMessage?.createdAt,
                unreadCount,
                messages: conv.messages,
            };
        }));
        // Sắp xếp theo thời gian gần nhất
        enrichedConversations.sort((a, b) => new Date(b.lastSentAt ?? 0).getTime() - new Date(a.lastSentAt ?? 0).getTime());
        res.json(enrichedConversations);
    }
    catch (err) {
        console.error('❌ /conversations error:', err);
        res.status(500).json({ error: err.message });
    }
});
// Đánh dấu tin nhắn đã đọc
router.patch('/messages/:userId/read', authenticateJWT_1.authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await ZaloMessage_1.default.updateMany({ userId, senderType: 'customer', read: false }, { $set: { read: true } });
        res.json({ success: true, modified: result.modifiedCount });
    }
    catch (err) {
        console.error('❌ /messages/:userId/read error:', err);
        res.status(500).json({ error: err.message });
    }
});
//
router.post('/assign-conversation', authenticateJWT_1.authenticateToken, (0, authorizeRole_1.authorizeRoles)(['admin']), async (req, res) => {
    try {
        const { userId, telesaleId } = req.body;
        if (!userId || !telesaleId) {
            res.status(400).json({ success: false, message: 'Thiếu userId hoặc telesaleId' });
            return;
        }
        const result = await ZaloMessage_1.default.updateMany({ userId }, { $set: { assignedTelesale: telesaleId } });
        server_1.io.to(telesaleId).emit('assigned_conversation', { userId, telesaleId });
        res.json({ success: true, message: `Đã assign ${result.modifiedCount} tin nhắn`, userId });
    }
    catch (err) {
        console.error('❌ /assign-conversation error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});
// Assign telesale (admin only)
router.post('/assign-telesale', authenticateJWT_1.authenticateToken, (0, authorizeRole_1.authorizeRoles)(['admin']), async (req, res) => {
    try {
        const { messageId, telesaleId } = req.body;
        if (!messageId || !telesaleId) {
            res.status(400).json({ success: false, message: 'Thiếu messageId hoặc telesaleId' });
            return;
        }
        // Kiểm tra messageId hợp lệ
        if (!messageId.match(/^[0-9a-fA-F]{24}$/)) {
            res.status(400).json({
                success: false,
                message: 'messageId không hợp lệ (phải là ObjectId MongoDB)',
            });
            return;
        }
        const updated = await ZaloMessage_1.default.findByIdAndUpdate(messageId, { assignedTelesale: telesaleId }, { new: true });
        if (!updated) {
            res.status(404).json({ success: false, message: 'Không tìm thấy message để assign' });
            return;
        }
        server_1.io.to(telesaleId).emit('assigned_message', updated);
        res.json({ success: true, message: 'Assign telesale thành công', updated });
    }
    catch (err) {
        console.error('❌ /assign-telesale error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});
// Messages user
router.get('/messages/:userId', async (req, res) => {
    const { userId } = req.params;
    const role = req.query.role;
    const telesaleId = req.query.telesaleId;
    let query = { userId };
    if (role === 'telesale' && telesaleId)
        query.assignedTelesale = telesaleId;
    try {
        const messages = await ZaloMessage_1.default.find(query).sort({ sentAt: 1 }).lean();
        // thêm trạng thái online cho từng message
        const messagesWithOnline = await Promise.all(messages.map(async (msg) => {
            const guest = await ZaloGuestUser_1.default.findById(msg.userId);
            const isOnline = guest?.lastInteraction
                ? Date.now() - guest.lastInteraction.getTime() < ONLINE_THRESHOLD_MS
                : false;
            return { ...msg, isOnline };
        }));
        res.json(messagesWithOnline);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
// List telesales
router.get('/telesales', async (req, res) => {
    try {
        const telesales = await User_1.default.find({ role: 'telesale' }).select('id username email phone');
        res.json(telesales);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
//=====================CAll zalo==========================
// Gọi điện thoại zalo từ crm -> khách hàng
router.post('/call/create', async (req, res, next) => {
    console.log('🚀 Đã nhận POST /api/zalo/call/create từ crm tới khách hàng với body:', req.body);
    next();
}, zaloCallController_1.createCallController);
//Gọi điện thoại zalo từ khách hàng ->  crm 
router.post('/call/inbound', async (req, res, next) => {
    console.log('🚀 Đã nhận POST /api/zalo/call/inbound từ khách hàng tới crm với body:', req.body);
    next();
}, zaloCallController_2.inboundCallController);
//route mới để gửi tin nhắn OA có nút “Gọi ngay” đến khách hàng
router.post("/send-call-button", async (req, res) => {
    try {
        const { userId, productName } = req.body;
        const accessToken = await (0, zaloService_2.getAccessToken)();
        const message = {
            recipient: { user_id: userId },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: `📞 Bạn muốn gọi tư vấn ngay về sản phẩm "${productName}"?`,
                        buttons: [
                            {
                                title: "📞 Gọi tư vấn ngay",
                                type: "oa.query.hide", // hoặc "oa.query.show"
                                payload: "CALL_NOW",
                            },
                        ],
                    },
                },
            },
        };
        const zaloRes = await axios_1.default.post("https://openapi.zalo.me/v3.0/oa/message", message, {
            headers: {
                access_token: accessToken,
                "Content-Type": "application/json",
            },
        });
        console.log("✅ Gửi thành công nút gọi tư vấn:", zaloRes.data);
        res.json({ success: true, data: zaloRes.data });
    }
    catch (err) {
        console.error("❌ Lỗi gửi tin nhắn gọi tư vấn:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});
//============================================================
//kiểm tra Access Token & Refresh Token hiện tại mà backend lưu trong MongoDB
router.get('/token/latest', async (_req, res) => {
    const token = await ZaloToken_1.default.findOne().sort({ createdAt: -1 });
    res.json(token);
});
exports.default = router;
