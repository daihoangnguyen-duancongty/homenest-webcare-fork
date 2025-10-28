"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
// ✅ Middleware xác thực JWT và load user từ DB
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Bearer <token>
    if (!token) {
        res.status(401).json({ message: 'Không có token, truy cập bị từ chối.' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await User_1.default.findById(decoded.id).select('-password');
        if (!user) {
            res.status(404).json({ message: 'Không tìm thấy người dùng.' });
            return;
        }
        req.user = {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            role: user.role,
            avatar: user.avatar,
        };
        next();
    }
    catch (err) {
        console.error('❌ Lỗi xác thực JWT:', err);
        res.status(403).json({ message: 'Token không hợp lệ.' });
    }
};
exports.authenticateToken = authenticateToken;
