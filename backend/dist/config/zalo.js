"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZALO_CONFIG = void 0;
exports.ZALO_CONFIG = {
    APP_ID: process.env.ZALO_APP_ID || 'your_app_id',
    APP_SECRET: process.env.ZALO_APP_SECRET || 'your_app_secret',
    REFRESH_TOKEN: process.env.ZALO_REFRESH_TOKEN || 'your_refresh_token',
};
