"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zaloWebhookController = exports.sendMessageController = exports.getTokenController = void 0;
const zaloService_1 = require("../services/zaloService");
const ZaloGuestUser_1 = __importDefault(require("../models/ZaloGuestUser"));
const ZaloMessage_1 = __importDefault(require("../models/ZaloMessage"));
const server_1 = require("../server");
const User_1 = __importDefault(require("../models/User"));
const mockUser_1 = require("../utils/mockUser");
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 phút
// Kiểm tra Access token khi server khởi động
(async () => {
    try {
        const token = await (0, zaloService_1.getAccessToken)();
        console.log('✅ Access Token OA:', token);
    }
    catch (err) {
        console.error('❌ Lỗi khi lấy access token:', err);
    }
})();
// Lấy token
const getTokenController = async (req, res) => {
    try {
        const token = await (0, zaloService_1.getAccessToken)();
        await ZaloGuestUser_1.default.findOneAndUpdate({ _id: 'system' }, { $setOnInsert: { username: 'System Bot', email: 'system@zalo.local' } }, { upsert: true });
        await ZaloMessage_1.default.create({
            userId: 'system',
            text: 'Get Access Token',
            success: true,
            response: { token },
        });
        res.status(200).json({ access_token: token });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
exports.getTokenController = getTokenController;
// Gửi tin nhắn
const sendMessageController = async (req, res) => {
    try {
        const { userId, text } = req.body;
        if (!userId || !text) {
            res.status(400).json({ error: 'userId và text là bắt buộc' });
            return;
        }
        const sender = req.user;
        if (!sender?.id) {
            res.status(401).json({ error: 'Không xác định được người gửi' });
            return;
        }
        const senderUser = await User_1.default.findById(sender.id).lean();
        if (!senderUser) {
            res.status(404).json({ error: 'Không tìm thấy user trong hệ thống' });
            return;
        }
        const senderUsername = senderUser.username;
        const senderAvatar = senderUser.avatar?.path ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(senderUsername)}&background=random`;
        const senderRole = senderUser.role;
        // Upsert guest mock và cập nhật lastInteraction
        const guest = await ZaloGuestUser_1.default.findOneAndUpdate({ _id: userId }, {
            $setOnInsert: (0, mockUser_1.createMockUser)(userId),
            $set: { lastInteraction: new Date() },
        }, { upsert: true, new: true });
        // Gửi tin nhắn tới OA
        const result = await (0, zaloService_1.sendMessage)(userId, text);
        // Lưu tin nhắn
        const saved = await ZaloMessage_1.default.create({
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
        const isOnline = guest.lastInteraction
            ? Date.now() - guest.lastInteraction.getTime() < ONLINE_THRESHOLD_MS
            : false;
        server_1.io.to(userId).emit('new_message', { ...saved.toObject(), isOnline });
        console.log(`📤 ${senderRole} ${senderUsername} gửi tin nhắn tới userId=${userId}`);
        res.status(200).json({ success: true, message: saved });
    }
    catch (err) {
        console.error('❌ sendMessageController error:', err);
        res.status(500).json({ error: err.message });
    }
};
exports.sendMessageController = sendMessageController;
// Webhook nhận tin nhắn
const zaloWebhookController = async (req, res) => {
    try {
        let payload = req.body;
        if (typeof payload === 'string')
            payload = JSON.parse(payload);
        res.status(200).send('OK'); // trả 200 ngay
        const senderId = payload?.sender?.id ?? payload?.user?.id;
        if (!senderId)
            return;
        // Upsert guest mock và cập nhật lastInteraction
        const guest = await ZaloGuestUser_1.default.findOneAndUpdate({ _id: senderId }, {
            $setOnInsert: (0, mockUser_1.createMockUser)(senderId),
            $set: { lastInteraction: new Date() },
        }, { upsert: true, new: true });
        // Fetch profile thật từ Zalo
        let profile = { name: guest.username, avatar: guest.avatar ?? null };
        try {
            const p = await (0, zaloService_1.fetchZaloUserDetail)(senderId);
            if (p) {
                profile = { name: p.name, avatar: p.avatar ?? null };
                await ZaloGuestUser_1.default.findOneAndUpdate({ _id: senderId }, { $set: { username: profile.name, avatar: profile.avatar } }, { upsert: true });
            }
        }
        catch (err) {
            console.warn('⚠️ Fetch profile OA failed, fallback mock:', err);
        }
        // Lưu từng tin nhắn
        const messages = payload?.data ?? [{ message: payload?.message?.text ?? '[no text]', time: Date.now() }];
        for (const msg of messages) {
            const text = msg.message ?? '[no text]';
            const sentAt = msg.time ? new Date(msg.time) : new Date();
            const saved = await ZaloMessage_1.default.create({
                userId: senderId,
                text,
                username: profile.name,
                avatar: profile.avatar,
                senderType: 'customer',
                success: true,
                response: msg,
                sentAt,
                read: false,
            });
            const isOnline = guest.lastInteraction
                ? Date.now() - guest.lastInteraction.getTime() < ONLINE_THRESHOLD_MS
                : false;
            // Emit realtime cho admin
            const admins = await User_1.default.find({ role: 'admin' });
            admins.forEach((a) => server_1.io.to(a._id.toString()).emit('new_message', {
                ...saved.toObject(),
                isOnline,
            }));
        }
        console.log(`💬 Saved ${messages.length} message(s) from userId=${senderId}`);
    }
    catch (err) {
        console.error('❌ Zalo webhook POST unexpected error:', err);
    }
};
exports.zaloWebhookController = zaloWebhookController;
