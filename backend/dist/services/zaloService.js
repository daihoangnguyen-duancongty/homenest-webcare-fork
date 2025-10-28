"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccessToken = getAccessToken;
exports.sendMessage = sendMessage;
exports.fetchZaloUserDetail = fetchZaloUserDetail;
exports.fetchDetailAndSendMessage = fetchDetailAndSendMessage;
const axios_1 = __importDefault(require("axios"));
const zalo_1 = require("../config/zalo");
const ZaloToken_1 = __importDefault(require("../models/ZaloToken"));
const ZaloGuestUser_1 = __importDefault(require("../models/ZaloGuestUser"));
const qs_1 = __importDefault(require("qs"));
let cachedAccessToken = null;
let tokenExpiry = 0;
/**
 * Lấy Access Token mới bằng Refresh Token
 */
async function getAccessToken() {
    const now = Date.now();
    if (cachedAccessToken && now < tokenExpiry) {
        return cachedAccessToken;
    }
    const latest = await ZaloToken_1.default.findOne().sort({ createdAt: -1 });
    const config = (0, zalo_1.getZaloConfig)();
    const refreshTokenToUse = latest?.refresh_token || config.REFRESH_TOKEN;
    console.log("♻️ Làm mới token bằng refresh_token:", refreshTokenToUse.slice(0, 20) + "...");
    const res = await axios_1.default.post("https://oauth.zaloapp.com/v4/oa/access_token", qs_1.default.stringify({
        app_id: config.APP_ID,
        grant_type: "refresh_token",
        refresh_token: refreshTokenToUse,
    }), {
        headers: {
            secret_key: config.APP_SECRET,
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
    const data = res.data;
    if (!data.access_token || !data.refresh_token) {
        throw new Error(`Zalo API không trả về access_token hợp lệ: ${JSON.stringify(data)}`);
    }
    const expiresIn = parseInt(data.expires_in || "86400", 10);
    await ZaloToken_1.default.create({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(Date.now() + expiresIn * 1000),
    });
    cachedAccessToken = data.access_token;
    tokenExpiry = Date.now() + expiresIn * 1000;
    console.log("✅ Access Token OA mới:", cachedAccessToken.slice(0, 25) + "...");
    return cachedAccessToken;
}
/**
 * Gửi tin nhắn CS cho user đúng chuẩn header access_token
 */
async function sendMessage(userId, text) {
    const token = await getAccessToken();
    const res = await axios_1.default.post('https://openapi.zalo.me/v3.0/oa/message/cs', {
        recipient: { user_id: userId },
        message: { text },
    }, {
        headers: {
            'Content-Type': 'application/json',
            'access_token': token, // ✅ Zalo yêu cầu
        },
    });
    console.log(`📤 Đã gửi tin nhắn tới ${userId}:`, res.data);
    return res.data;
}
/**
 * Fetch profile user và cập nhật DB
 */
async function fetchZaloUserDetail(userId) {
    try {
        // 1️⃣ Lấy token mới
        await getAccessToken();
        // 2️⃣ Lấy token từ DB
        const latest = await ZaloToken_1.default.findOne().sort({ createdAt: -1 });
        const token = latest?.access_token;
        if (!token) {
            console.warn('⚠️ Token OA trống khi fetch chi tiết user!');
            return null;
        }
        // 3️⃣ Delay 1 giây để token active
        await new Promise(resolve => setTimeout(resolve, 1000));
        // 4️⃣ Gọi API user/detail
        const dataParam = JSON.stringify({ user_id: userId });
        const url = `https://openapi.zalo.me/v3.0/oa/user/detail?data=${encodeURIComponent(dataParam)}`;
        const res = await axios_1.default.get(url, {
            headers: { 'access_token': token },
        });
        const detail = res.data;
        if (detail.error === 0) {
            const sharedInfo = detail.data.shared_info || {};
            // Upsert vào MongoDB
            // Upsert vào GuestUser
            await ZaloGuestUser_1.default.findOneAndUpdate({ _id: userId }, // string Zalo userId
            {
                $set: {
                    username: detail.data.display_name,
                    avatar: detail.data.avatar,
                    phone: detail.data.shared_info?.phone || '',
                    address: detail.data.shared_info?.address || '',
                },
                $setOnInsert: {
                    email: `${userId}@zalo.local`,
                },
            }, { upsert: true, new: true });
            console.log("✅ User detail upsert thành công:", detail.data.display_name);
            return detail.data;
        }
        else {
            console.warn(`⚠️ Lỗi fetch user detail Zalo: ${detail.error}`, detail.message);
            return null;
        }
    }
    catch (err) {
        console.error("❌ Failed to fetch Zalo user detail:", err.message || err);
        return null;
    }
}
/**
 * Hàm tiện ích: fetch profile rồi gửi tin nhắn CS
 */
async function fetchDetailAndSendMessage(userId, text) {
    const detail = await fetchZaloUserDetail(userId);
    if (!detail) {
        console.warn(`⚠️ Không fetch được chi tiết userId=${userId}, vẫn gửi tin nhắn`);
    }
    return await sendMessage(userId, text);
}
