"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("../database/connection");
const zaloController_1 = require("../controllers/zaloController");
const server_1 = require("../server"); // ✅ Socket.IO instance
const express_1 = require("express");
const router = (0, express_1.Router)();
// ✅ Lấy token từ Zalo (nếu cần test)
router.get('/token', zaloController_1.getTokenController);
// ✅ Webhook nhận tin nhắn từ Zalo OA
router.post('/zalo', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sender, message } = req.body;
    const userId = (sender === null || sender === void 0 ? void 0 : sender.id) || 'unknown';
    const text = (message === null || message === void 0 ? void 0 : message.text) || '';
    // 1️⃣ Upsert user
    yield connection_1.prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
            id: userId,
            email: `${userId}@zalo.local`,
            password: 'zalo-auto',
            username: `ZaloUser-${userId}`,
            phone: userId,
            address: '',
        },
    });
    // 2️⃣ Lưu tin nhắn
    const saved = yield connection_1.prisma.zaloMessage.create({
        data: { userId, text, success: true, response: req.body },
    });
    // 3️⃣ Emit realtime
    // Admin nhận tất cả
    const admins = yield connection_1.prisma.user.findMany({ where: { role: 'admin' } });
    admins.forEach((a) => server_1.io.to(a.id).emit('new_message', saved));
    // Telesale sẽ nhận khi admin assign (không emit tại đây)
    res.status(200).json({ success: true });
}));
// ✅ API admin gửi tin nhắn tới user
router.post('/send', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, text, assignedTelesale } = req.body;
    try {
        yield connection_1.prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                email: `${userId}@zalo.local`,
                password: 'zalo-auto',
                username: `ZaloUser-${userId}`,
                phone: userId,
                address: '',
            },
        });
        const savedMessage = yield connection_1.prisma.zaloMessage.create({
            data: {
                userId,
                text,
                success: true,
                assignedTelesale: assignedTelesale || null,
            },
        });
        // 💡 Log ra terminal để kiểm tra
        console.log('=== New message received ===');
        console.log('User ID:', savedMessage.userId);
        console.log('Text:', savedMessage.text);
        console.log('Assigned telesale:', savedMessage.assignedTelesale);
        console.log('Saved at:', savedMessage.sentAt);
        // 1️⃣ Emit cho khách hàng
        server_1.io.to(userId).emit('new_message', savedMessage);
        // 2️⃣ Emit cho admin
        const admins = yield connection_1.prisma.user.findMany({ where: { role: 'admin' } });
        admins.forEach((a) => server_1.io.to(a.id).emit('new_message', savedMessage));
        // 3️⃣ Emit cho telesale nếu có assignedTelesale
        if (assignedTelesale) {
            server_1.io.to(assignedTelesale).emit('new_message', savedMessage);
        }
        res.status(200).json(savedMessage);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
// ✅ Lấy danh sách hội thoại (mỗi user 1 dòng cuối)
router.get('/conversations', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = yield connection_1.prisma.zaloMessage.findMany({
        orderBy: { sentAt: 'desc' },
    });
    const dataMap = new Map();
    for (const msg of messages) {
        if (!dataMap.has(msg.userId))
            dataMap.set(msg.userId, msg);
    }
    res.json([...dataMap.values()]);
}));
// ✅ Lấy toàn bộ tin nhắn của 1 user + phân quyền
router.get('/messages/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const role = req.query.role;
    const telesaleId = req.query.telesaleId;
    let where = { userId };
    if (role === 'telesale') {
        // Chỉ lấy các tin nhắn đã được assign cho telesale
        where.assignedTelesale = telesaleId;
    }
    const messages = yield connection_1.prisma.zaloMessage.findMany({
        where,
        orderBy: { sentAt: 'asc' },
    });
    res.json(messages);
}));
// admin chi dinh telesales
router.post('/assign-telesale', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { messageId, telesaleId } = req.body;
    const updated = yield connection_1.prisma.zaloMessage.update({
        where: { id: messageId },
        data: { assignedTelesale: telesaleId },
    });
    // Emit cho telesale được assign
    server_1.io.to(telesaleId).emit('assigned_message', updated);
    res.json(updated);
}));
// ✅ Lấy danh sách telesale (chỉ admin dùng)
router.get('/telesales', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const telesales = yield connection_1.prisma.user.findMany({
            where: { role: 'telesale' },
            select: { id: true, username: true, email: true, phone: true },
        });
        res.json(telesales);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
exports.default = router;
