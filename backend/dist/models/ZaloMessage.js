"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connection_1 = require("../database/connection");
const ZaloMessageSchema = new mongoose_1.Schema({
    userId: { type: String, ref: 'GuestUser', required: true },
    text: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    success: { type: Boolean, required: true },
    response: { type: mongoose_1.Schema.Types.Mixed },
    username: { type: String },
    avatar: { type: String },
    assignedTelesale: { type: String, default: null },
    senderType: { type: String, enum: ['admin', 'telesale', 'customer'], default: 'customer' },
    read: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } });
const ZaloMessageModel = connection_1.zaloMessageDB.model('ZaloMessage', ZaloMessageSchema, 'zaloMessages');
exports.default = ZaloMessageModel;
