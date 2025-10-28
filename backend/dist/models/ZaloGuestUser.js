"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connection_1 = require("../database/connection");
const guestUserSchema = new mongoose_1.Schema({
    _id: { type: String, required: true }, // lưu Zalo userId
    username: { type: String, required: true },
    email: { type: String },
    avatar: { type: String },
    isOnline: { type: Boolean, default: false },
    lastInteraction: { type: Date, default: null },
    assignedTelesale: { type: String, default: null },
}, { timestamps: true });
const GuestUser = connection_1.zaloMessageDB.model('GuestUser', guestUserSchema, 'guestUsers');
exports.default = GuestUser;
