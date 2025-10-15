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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccessToken = getAccessToken;
exports.sendMessage = sendMessage;
const axios_1 = __importDefault(require("axios"));
const zalo_1 = require("../config/zalo");
let cachedAccessToken = null;
let tokenExpiry = 0;
/**
 * Lấy Access Token mới bằng Refresh Token
 */
function getAccessToken() {
    return __awaiter(this, void 0, void 0, function* () {
        const now = Date.now();
        if (cachedAccessToken && now < tokenExpiry) {
            return cachedAccessToken;
        }
        const res = yield axios_1.default.post('https://oauth.zaloapp.com/v4/oa/access_token', {
            app_id: zalo_1.ZALO_CONFIG.APP_ID,
            app_secret: zalo_1.ZALO_CONFIG.APP_SECRET,
            refresh_token: zalo_1.ZALO_CONFIG.REFRESH_TOKEN,
            grant_type: 'refresh_token',
        });
        const data = res.data; // ✅ Cast unknown -> any
        cachedAccessToken = data.access_token;
        tokenExpiry = now + (data.expires_in - 60) * 1000;
        console.log(' Access Token mới:', cachedAccessToken);
        return cachedAccessToken;
    });
}
/**
 * Gửi tin nhắn từ OA tới user
 */
function sendMessage(userId, text) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getAccessToken();
        const res = yield axios_1.default.post('https://openapi.zalo.me/v3.0/oa/message/cs', {
            recipient: { user_id: userId },
            message: { text },
        }, {
            headers: {
                access_token: token,
                'Content-Type': 'application/json',
            },
        });
        const data = res.data; // ✅ Cast unknown -> any
        console.log(' Đã gửi tin nhắn:', data);
        return data;
    });
}
