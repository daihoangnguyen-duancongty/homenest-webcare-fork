"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getZaloConfig = getZaloConfig;
function getZaloConfig() {
    return {
        APP_ID: process.env.ZALO_APP_ID || "1729920386336093975",
        APP_SECRET: process.env.ZALO_APP_SECRET || "ePSh5U838W6H3q7C8BA2", // chính là secret_key
        REFRESH_TOKEN: process.env.ZALO_REFRESH_TOKEN || "s54CT-s3BmZQMmrpxeC...", // của bạn
    };
}
