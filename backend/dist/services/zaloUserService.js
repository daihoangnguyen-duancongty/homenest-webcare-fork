"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfileV4 = getUserProfileV4;
const axios_1 = __importDefault(require("axios"));
async function getUserProfileV4(userAccessToken) {
    try {
        const res = await axios_1.default.get('https://openapi.zalo.me/v4.0/me', {
            headers: { Authorization: `Bearer ${userAccessToken}` },
        });
        return res.data; // name, avatar, phone, email, birthday,...
    }
    catch (err) {
        console.error('❌ Failed fetch user profile V4:', err);
        return null;
    }
}
