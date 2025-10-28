"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const zaloUserService_1 = require("../services/zaloUserService");
const router = (0, express_1.Router)();
// /login → redirect Zalo OAuth V4
router.get('/login', (req, res) => {
    const appId = process.env.ZALO_APP_ID;
    const redirectUri = encodeURIComponent(`${process.env.BASE_URL}/api/zalo-user/callback`);
    const codeVerifier = crypto_1.default.randomBytes(32).toString('hex').slice(0, 43);
    const codeChallenge = crypto_1.default.createHash('sha256').update(codeVerifier).digest().toString('base64url');
    const state = crypto_1.default.randomBytes(8).toString('hex');
    req.session.codeVerifier = codeVerifier;
    req.session.state = state;
    const authUrl = `https://oauth.zaloapp.com/v4/permission?app_id=${appId}&redirect_uri=${redirectUri}&code_challenge=${codeChallenge}&state=${state}`;
    res.redirect(authUrl);
});
// /callback → nhận code → lấy User Access Token → fetch profile
router.get('/callback', async (req, res) => {
    const { code, state } = req.query;
    const sessionState = req.session.state;
    const codeVerifier = req.session.codeVerifier;
    if (!codeVerifier || !sessionState || state !== sessionState) {
        res.status(400).send('Invalid state or missing session data');
        return;
    }
    try {
        const response = await axios_1.default.post('https://oauth.zaloapp.com/v4/access_token', new URLSearchParams({
            code: code,
            app_id: process.env.ZALO_APP_ID,
            grant_type: 'authorization_code',
            code_verifier: codeVerifier,
        }).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                secret_key: process.env.ZALO_APP_SECRET,
            },
        });
        const data = response.data;
        console.log('✅ User Access Token V4:', data.access_token);
        const profile = await (0, zaloUserService_1.getUserProfileV4)(data.access_token);
        console.log('✅ User profile V4:', profile);
        res.json({ access_token: data.access_token, profile });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi lấy User Access Token');
    }
});
exports.default = router;
