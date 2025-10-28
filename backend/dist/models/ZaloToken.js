"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connection_1 = require("../database/connection");
const ZaloTokenSchema = new mongoose_1.Schema({
    access_token: { type: String, required: true },
    refresh_token: { type: String, required: true },
    expires_at: { type: Date, required: true },
}, { timestamps: true });
exports.default = connection_1.userDB.model('ZaloToken', ZaloTokenSchema, 'zaloTokens');
