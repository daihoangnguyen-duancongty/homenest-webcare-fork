"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
        res.status(401).json({ message: 'Không có token, truy cập bị từ chối.' });
        return;
    }
    try {
        // Ép kiểu giá trị decoded thành { role: "admin" | "customer" | "telesale"; ... }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        console.log('Decoded user từ token:', decoded);
        req.user = decoded; // Lưu thông tin user vào req để dùng ở route sau
        next();
    }
    catch (err) {
        res.status(403).json({ message: 'Token không hợp lệ.' });
        return;
    }
};
exports.authenticateToken = authenticateToken;
