"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connection_1 = require("../database/connection");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Schema
const userSchema = new mongoose_1.Schema({
    username: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: {
        type: {
            path: String,
            filename: String,
            originalname: String,
        },
        required: false,
        default: {},
    },
    role: { type: String, enum: ['admin', 'telesale'], default: 'telesale' },
}, { timestamps: true });
// Instance method
userSchema.methods.comparePassword = function (plain) {
    return bcryptjs_1.default.compare(plain, this.password);
};
// Static method
userSchema.statics.hashPassword = async function (plain) {
    const salt = await bcryptjs_1.default.genSalt(10);
    return bcryptjs_1.default.hash(plain, salt);
};
// Optional: hash password before save (chỉ hash khi password mới hoặc modified)
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcryptjs_1.default.hash(this.password, 10);
    }
    next();
});
// Export model
const User = connection_1.userDB.model('User', userSchema, 'users');
exports.default = User;
