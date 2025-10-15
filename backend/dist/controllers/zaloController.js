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
exports.sendMessageController = exports.getTokenController = void 0;
const zaloService_1 = require("../services/zaloService");
const connection_1 = require("../database/connection");
const server_1 = require("../server"); // 👈 dùng để emit real-time
// ================= LẤY TOKEN =================
const getTokenController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = yield (0, zaloService_1.getAccessToken)();
        // ✅ Đảm bảo có user "system" (tránh lỗi FK)
        yield connection_1.prisma.user.upsert({
            where: { id: 'system' },
            update: {},
            create: {
                id: 'system',
                email: 'system@zalo.local',
                password: 'system',
                username: 'System Bot',
                phone: '',
                address: '',
            },
        });
        // ✅ Lưu token vào DB để theo dõi
        yield connection_1.prisma.zaloMessage.create({
            data: {
                userId: 'system',
                text: 'Get Access Token',
                success: true,
                response: { token },
            },
        });
        res.status(200).json({ access_token: token });
    }
    catch (error) {
        console.error('❌ Error getToken:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.getTokenController = getTokenController;
// ================= GỬI TIN NHẮN =================
const sendMessageController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { userId, text } = req.body;
        if (!userId || !text) {
            res.status(400).json({ error: 'userId và text là bắt buộc' });
            return;
        }
        // ✅ Nếu user chưa có → tạo tự động để tránh lỗi FK
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
        // ✅ Gửi tin nhắn đến Zalo OA qua service
        const result = yield (0, zaloService_1.sendMessage)(userId, text);
        // ✅ Lưu lịch sử tin nhắn
        const saved = yield connection_1.prisma.zaloMessage.create({
            data: {
                userId,
                text,
                // @ts-ignore
                success: (result === null || result === void 0 ? void 0 : result.error) === 0,
                // @ts-ignore
                response: result,
            },
        });
        // ✅ Emit real-time đến frontend
        server_1.io.to(userId).emit('new_message', saved);
        res.status(200).json({ success: true, result, saved });
    }
    catch (error) {
        console.error('❌ Error sendMessage:', error);
        const fallbackUserId = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.userId) || 'unknown';
        // ✅ Tạo user dự phòng nếu chưa có
        yield connection_1.prisma.user.upsert({
            where: { id: fallbackUserId },
            update: {},
            create: {
                id: fallbackUserId,
                email: `${fallbackUserId}@zalo.local`,
                password: 'zalo-auto',
                username: `ZaloUser-${fallbackUserId}`,
                phone: fallbackUserId,
                address: '',
            },
        });
        // ✅ Lưu log lỗi vào DB
        yield connection_1.prisma.zaloMessage.create({
            data: {
                userId: fallbackUserId,
                text: ((_b = req.body) === null || _b === void 0 ? void 0 : _b.text) || '',
                success: false,
                response: { message: error.message },
            },
        });
        res.status(500).json({ error: error.message });
    }
});
exports.sendMessageController = sendMessageController;
